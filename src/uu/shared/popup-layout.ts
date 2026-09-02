// Framework-agnostic tracker for a popup anchored to a host element: decides
// which side (top/bottom) it renders on and how tall it can be, and keeps both
// live as the viewport changes — not just once when the popup opens, but
// continuously while it stays open (window resize, page scroll on any
// scrollable ancestor).

export { trackPopupLayout };

// Flips a popup above its anchor when there isn't enough room below for it but
// there is more room above than below.
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
  // tracker while it's being managed (see MANAGED_PROPERTIES) — the caller
  // must not bind its own `style="..."` string onto the same element.
  getPopupElement: () => HTMLElement | null;
  // General cap on the popup's height in pixels before shrinking for available
  // space. Defaults to 288 (18em at the default 16px root font-size).
  maxHeightPx?: number;
  // Gap kept between the popup and the host, reused as a small buffer between
  // the popup and the viewport edge on its far side. Defaults to 2.
  gapPx?: number;
  // Promotes the popup into the browser's top layer via the Popover API
  // instead of the default `position: absolute` scheme. The default scheme
  // positions the popup relative to its own nearest positioned ancestor, which
  // gets clipped the moment that ancestor chain crosses a scrolling container
  // with `overflow: hidden` or its own stacking context. The top layer sits
  // above the entire document. Opt-in (the caller must also set
  // `popover="manual"` on the popup element itself) since it changes the
  // coordinate system to raw viewport pixels recomputed on every tick.
  usePopover?: boolean;
  // Whether the popup is forced to exactly the host's own width (the default,
  // `true`) — right for a form field's dropdown. Set `false` to leave the
  // popup's own width/left edge alone (still left-aligned to the host).
  matchWidth?: boolean;
}

interface PopupLayoutHandle {
  // Recomputes immediately — call whenever layout may be stale (the popup just
  // opened, or its content changed enough that its natural size might have).
  update(): void;
  // Restores the popup element's `style` attribute to whatever it was before
  // this tracker ever touched it.
  destroy(): void;
}

// Every inline style property this tracker owns while managing an element —
// one list so claim()/release() can't drift out of sync with what update()
// actually writes.
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
  // `display`) applied. Cleared whenever the popup goes `hidden` so re-showing
  // it always reapplies from scratch.
  let domVisible = false;
  // The popup's pre-existing inline style values for MANAGED_PROPERTIES,
  // captured the first time this tracker actually writes to it — so destroy()
  // hands the element back in whatever state the caller left it.
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
      // layer; calling it twice while already open throws, hence the guard.
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

  // Takes the popup out of normal document flow — done separately from, and
  // before, apply(): the first time a popup becomes visible, update() measures
  // the host's rect to decide placement, and a still-in-flow popup (as a flex
  // item of the same wrapper) would inflate that measurement.
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

    // A caller's own hidden state takes priority over this tracker's own
    // `display: flex`. An inline `display` always beats the `[hidden]` UA
    // rule, so once applied it has to be actively released whenever the popup
    // goes hidden.
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
    // offsetHeight — that's already clamped to a previous call's maxHeightPx,
    // which would make this self-referential.
    const nextPlacement = computeFlipPlacement(hostRect, maxHeightCap);
    const available = nextPlacement === "top" ? spaceAbove : spaceBelow;
    const nextMaxHeightPx = Math.max(0, Math.min(maxHeightCap, available));

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

  // A window resize or the page scrolling while the popup stays open changes
  // neither the caller's open state nor the render, so without these the popup
  // stays stuck at its last computed placement. Attached only while a popup is
  // actually visible.
  let tracking = false;

  function attachLiveTracking(): void {
    if (tracking) return;
    tracking = true;
    window.addEventListener("resize", onWindowResize);
    // capture: true so this also fires for scroll on any scrollable ancestor.
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
