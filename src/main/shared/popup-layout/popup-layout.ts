// Vanilla-JS, framework-agnostic tracker for a popup anchored to a host
// element: decides which side (top/bottom) it renders on and how tall it can
// be, and keeps both live as the viewport changes — not just once when the
// popup opens, but continuously while it stays open (window resize, page
// scroll on any scrollable ancestor). Originally split out of
// ui-autocomplete's core; see its header comment for why this is
// measured-rects JS rather than CSS anchor positioning (position-try-order:
// most-height proved unreliable in real-world testing).

export { trackPopupLayout };

// Flips a popup above its anchor when there isn't enough room below for it
// but there is more room above than below. Not exported — only used
// internally by trackPopupLayout below; ui-select/ui-combobox/ui-autocomplete
// all go through the full tracker now.
function computeFlipPlacement(
  hostRect: DOMRect,
  popupHeight: number,
): "top" | "bottom" {
  const spaceBelow = window.innerHeight - hostRect.bottom;
  const spaceAbove = hostRect.top;

  return popupHeight > spaceBelow && spaceAbove > spaceBelow ? "top" : "bottom";
}

interface TrackPopupLayoutConfig {
  // The element the popup is positioned relative to.
  getHostElement: () => HTMLElement | null;
  // The popup element itself. Its `style` attribute is fully owned by this
  // tracker while it's being managed (see MANAGED_PROPERTIES below) — the
  // caller must not bind its own `style="..."` string onto the same element
  // (a Lit `styleMap` binding for unrelated properties is fine, since that
  // patches individual properties rather than replacing the whole attribute).
  getPopupElement: () => HTMLElement | null;
  // General cap on the popup's height, in pixels, before shrinking for
  // available space. Defaults to 288 (18em at the default 16px root
  // font-size).
  maxHeightPx?: number;
  // Gap kept between the popup and the host, and reused as a small buffer
  // between the popup and the viewport edge on its far side. Defaults to 2.
  gapPx?: number;
  // Promotes the popup into the browser's top layer via the Popover API
  // (https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) instead of
  // the default `position: absolute` scheme below. The default scheme
  // positions the popup relative to its own nearest positioned ancestor,
  // which works fine floating over ordinary page content but gets clipped or
  // buried the moment that ancestor chain crosses something like a scrolling
  // container with `overflow: hidden` or its own stacking context (e.g. a
  // data grid's virtualized header row) — the popup can't escape a box it's
  // laid out inside of. The top layer sits above the entire document
  // regardless of any of that, which is the whole point of the API. Opt-in
  // (the caller must also set `popover="manual"` on the popup element itself
  // — see `ensureOutOfFlow`/`apply` below for why "manual") since it changes
  // the coordinate system from relative percentages to raw viewport pixels
  // recomputed on every tick, not just when placement/height actually change
  // — unnecessary work for the common case where the default scheme already
  // works fine.
  usePopover?: boolean;
  // Whether the popup is forced to exactly the host's own width (the
  // default, `true`) — right for a form field's dropdown (ui-select,
  // ui-combobox, ui-autocomplete), where the popup is conceptually an
  // extension of the field itself. A menu (ui-menu-button/ui-split-button)
  // wants the opposite: its trigger's width has nothing to do with how wide
  // its labels need — set `false` to leave the popup's own width/left edge
  // alone (still left-aligned to the host, still governed by whatever
  // min/max-width the popup's own stylesheet sets) rather than stretching
  // or squeezing it to match.
  matchWidth?: boolean;
}

interface PopupLayoutHandle {
  // Recomputes immediately — call this whenever the caller has a reason to
  // believe layout may be stale (typically: the popup just opened, or its
  // content changed enough that its natural size might have too).
  update(): void;
  // Restores the popup element's `style` attribute to whatever it was before
  // this tracker ever touched it (see MANAGED_PROPERTIES/claim() below).
  destroy(): void;
}

// Every inline style property this tracker owns while it's managing an
// element — kept as one list so claim()/release() (the snapshot/restore
// pair) can't drift out of sync with what update() actually writes.
const MANAGED_PROPERTIES = [
  "position",
  "inset-inline",
  "left",
  "width",
  "z-index",
  "display",
  "flex-direction",
  "overflow",
  "box-sizing",
  "max-height",
  "top",
  "bottom",
];

function trackPopupLayout(config: TrackPopupLayoutConfig): PopupLayoutHandle {
  const maxHeightCap = config.maxHeightPx ?? 288;
  const gapPx = config.gapPx ?? 2;
  const matchWidth = config.matchWidth ?? true;

  let placement: "top" | "bottom" = "bottom";
  let maxHeightPx = maxHeightCap;
  // Whether the popup currently has this tracker's full layout (including
  // `display`) applied. Cleared whenever the popup goes `hidden` (see
  // update() below) so re-showing it always reapplies from scratch — not
  // just when placement/maxHeightPx happen to differ from last time, which
  // wouldn't otherwise be true right after a hidden->visible flip.
  let domVisible = false;
  // The popup's pre-existing inline style values for MANAGED_PROPERTIES,
  // captured the first time this tracker actually writes to it — so
  // destroy() can hand the element back in whatever state the caller left
  // it, rather than permanently claiming those properties. `undefined` means
  // "not claimed yet" (as opposed to an empty Map, which would mean "claimed
  // an element with none of these properties set").
  let claimedFrom: HTMLElement | undefined;
  let snapshot: Map<string, string> | undefined;

  function claim(popup: HTMLElement): void {
    if (claimedFrom === popup) return;
    snapshot = new Map(
      MANAGED_PROPERTIES.map((name) => [
        name,
        popup.style.getPropertyValue(name),
      ]),
    );
    claimedFrom = popup;
  }

  function release(): void {
    if (!claimedFrom || !snapshot) return;
    for (const [name, value] of snapshot) {
      if (value) {
        claimedFrom.style.setProperty(name, value);
      } else {
        claimedFrom.style.removeProperty(name);
      }
    }
    claimedFrom = undefined;
    snapshot = undefined;
  }

  function apply(popup: HTMLElement, hostRect: DOMRect): void {
    popup.style.setProperty("display", "flex");
    popup.style.setProperty("flex-direction", "column");
    popup.style.setProperty("overflow", "hidden");
    popup.style.setProperty("max-height", `${maxHeightPx}px`);

    if (config.usePopover) {
      // Top-layer coordinates are viewport-relative pixels, not percentages
      // of a local ancestor — recomputed from the host's own rect on every
      // call (see the comment on the `usePopover` config option for why this
      // can't just be "100%" the way the non-popover branch below gets away
      // with).
      popup.style.setProperty("left", `${hostRect.left}px`);
      if (matchWidth) {
        popup.style.setProperty("width", `${hostRect.width}px`);
      } else {
        popup.style.removeProperty("width");
      }
      if (placement === "bottom") {
        popup.style.setProperty("top", `${hostRect.bottom + gapPx}px`);
        popup.style.removeProperty("bottom");
      } else {
        popup.style.setProperty(
          "bottom",
          `${window.innerHeight - hostRect.top + gapPx}px`,
        );
        popup.style.removeProperty("top");
      }
      // showPopover() is what actually promotes the element into the top
      // layer — merely giving it `display: flex` above does not, and calling
      // it twice while already open throws, hence the guard.
      if (!popup.matches(":popover-open")) popup.showPopover();
      return;
    }

    if (placement === "bottom") {
      popup.style.setProperty("top", `calc(100% + ${gapPx}px)`);
      popup.style.removeProperty("bottom");
    } else {
      popup.style.setProperty("bottom", `calc(100% + ${gapPx}px)`);
      popup.style.removeProperty("top");
    }
  }

  // Takes the popup out of normal document flow. Safe to do unconditionally,
  // even while the popup is still `hidden` (a `display: none` element isn't
  // laid out at all, so its `position` has no visual effect yet) — and
  // that's exactly why this has to happen separately from, and before,
  // apply() above: the first time a popup ever becomes visible, update()
  // below measures the *host's* rect to decide placement, and if the popup
  // were still sitting in normal flow at that exact moment (position: static,
  // as a flex item of the same wrapper the host measures), its full
  // unclamped content height would inflate the host's own measured rect,
  // corrupting the very placement decision this is trying to make. Doing
  // this eagerly — on the first update() call regardless of hidden state —
  // guarantees the popup is already out of flow well before that moment ever
  // arrives.
  //
  // `usePopover`'s `position: fixed` needs no `inset-inline` counterpart
  // (`left`/`width` are set directly in apply() above, in pixels) — and no
  // out-of-flow step is actually needed for top-layer promotion itself
  // (that's what `showPopover()` in apply() does), but `position: fixed` is
  // still set here so the very first rect measurement in update() below
  // isn't thrown off by the popup still occupying normal flow space, same
  // reasoning as the non-popover branch.
  function ensureOutOfFlow(popup: HTMLElement): void {
    if (config.usePopover) {
      popup.style.setProperty("position", "fixed");
      popup.style.setProperty("z-index", "1");
      popup.style.setProperty("box-sizing", "border-box");
      return;
    }
    popup.style.setProperty("position", "absolute");
    if (matchWidth) {
      popup.style.setProperty("inset-inline", "0");
    } else {
      popup.style.removeProperty("inset-inline");
      popup.style.setProperty("left", "0");
    }
    popup.style.setProperty("z-index", "1");
    popup.style.setProperty("box-sizing", "border-box");
  }

  function update(): void {
    const host = config.getHostElement();
    const popup = config.getPopupElement();
    if (!host || !popup) return;

    if (claimedFrom !== popup) {
      claim(popup);
      ensureOutOfFlow(popup);
    }

    // A caller's own hidden-while-loading state (e.g. `hidden` bound to
    // something narrower than "the popup is conceptually open") takes
    // priority over this tracker's own `display: flex`. An inline `display`
    // always beats the `[hidden]` UA rule's `display: none` (inline style
    // wins over any stylesheet rule of any specificity, no matter when it was
    // set) — so once applied, it has to be actively released here whenever
    // the popup goes hidden, or every future hide would be silently defeated
    // by the leftover inline value. `hidden` is used as the sole
    // visible/not-visible signal (rather than a separate open flag from the
    // caller) since it's the one ground truth guaranteed to be current at the
    // moment this runs.
    if (popup.hidden) {
      if (domVisible) {
        popup.style.removeProperty("display");
        if (config.usePopover && popup.matches(":popover-open")) {
          popup.hidePopover();
        }
        domVisible = false;
        detachLiveTracking();
      }
      return;
    }

    const hostRect = host.getBoundingClientRect();
    const spaceBelow = window.innerHeight - hostRect.bottom - gapPx;
    const spaceAbove = hostRect.top - gapPx;
    // Compared against the general cap, not the popup's own current
    // offsetHeight — that's already clamped to whatever maxHeightPx a
    // *previous* call here landed on, which would make this comparison
    // self-referential (e.g. once shrunk to fit below, it'd measure as
    // "fitting" below forever after, never reconsidering whether above has
    // more room now). The question this needs to answer is always "would a
    // full-size popup fit here", not "does the already-compromised one".
    const nextPlacement = computeFlipPlacement(hostRect, maxHeightCap);
    const available = nextPlacement === "top" ? spaceAbove : spaceBelow;
    const nextMaxHeightPx = Math.max(0, Math.min(maxHeightCap, available));

    // `usePopover`'s coordinates are raw viewport pixels (not the "100%"
    // relative-to-ancestor math the default scheme uses), so they go stale on
    // every scroll even when placement/height themselves don't change —
    // always reapply for that mode, not just on an actual placement/height
    // change.
    if (
      !domVisible ||
      nextPlacement !== placement ||
      nextMaxHeightPx !== maxHeightPx ||
      config.usePopover
    ) {
      placement = nextPlacement;
      maxHeightPx = nextMaxHeightPx;
      domVisible = true;
      apply(popup, hostRect);
      attachLiveTracking();
    }
  }

  // Whatever triggers `update()` on open (the caller, typically right after
  // a render where its own open state just changed) only covers that one
  // moment — a window resize or the page scrolling while the popup stays
  // open changes neither, so without these it would stay stuck at whatever
  // placement/height it last computed instead of continuing to track the
  // host live. Attached only while a popup is actually visible (see
  // domVisible above/below) rather than for this tracker's whole lifetime —
  // a page can have many trackPopupLayout instances (one per ui-select,
  // say), almost all closed at any given moment, and each would otherwise
  // add its own permanent window-level resize/scroll (capture, so it also
  // fires for scrolling inside any open listbox's own options) listener
  // doing pointless work on every such event across the whole page.
  let tracking = false;

  function attachLiveTracking(): void {
    if (tracking) return;
    tracking = true;
    window.addEventListener("resize", onWindowResize);
    // capture: true so this also fires for scroll on any scrollable
    // ancestor, not just the window itself.
    window.addEventListener("scroll", onWindowScroll, {
      capture: true,
      passive: true,
    });
  }

  function detachLiveTracking(): void {
    if (!tracking) return;
    tracking = false;
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("scroll", onWindowScroll, { capture: true });
  }

  function onWindowResize(): void {
    update();
  }

  function onWindowScroll(): void {
    update();
  }

  return {
    update,
    destroy() {
      detachLiveTracking();
      release();
    },
  };
}
