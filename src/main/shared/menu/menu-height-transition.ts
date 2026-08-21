import { doubleRaf } from "./double-raf.js";
import type { TransitionState } from "./menu-core.js";

export { trackMenuHeightTransition };

interface TrackMenuHeightTransitionConfig {
  // The element whose box height should animate — menu-popup.ts's
  // `.viewport`, which auto-sizes to whichever page is currently in normal
  // flow (see that file's own header comment on the page-in/page-out
  // layout this depends on). Queried fresh each call, same reasoning as
  // shared/popup-layout/popup-layout.ts's own getters.
  getViewportElement: () => HTMLElement | null;
  durationMs: number;
}

interface MenuHeightTransitionHandle {
  // Call from the host's `willUpdate()`, passing whatever
  // `MenuController.transition` currently is — *before* this update's DOM
  // patch happens, so the viewport still reflects the outgoing page's
  // height. A no-op unless `transition` is a freshly-started one (a "start"
  // phase object this handle hasn't already captured a height for) —
  // MenuController hands back a new object per #beginTransition() call but
  // the *same* one across any re-renders that happen while still mid-start
  // (e.g. a hover-driven activeValue change), so identity comparison alone
  // tells the two apart.
  prepare(transition: TransitionState | undefined): void;
  // Call from the host's `updated()`, passing the same `transition` value —
  // *after* the DOM has been patched to reflect it. Turns a just-prepared
  // capture into an animated height change (freezes the viewport at the
  // captured height, then — after two rAFs, so that freeze actually paints
  // once first, same reasoning as double-raf.ts — transitions to whatever
  // height the incoming page naturally settled at). Once `transition` goes
  // back to undefined (settled), releases the viewport back to plain auto
  // sizing instead of leaving it pinned at a stale pixel value forever,
  // which would go stale the moment anything resizes the settled page
  // outside of a stack transition (e.g. a caller replacing `items`).
  apply(transition: TransitionState | undefined): void;
}

function trackMenuHeightTransition(
  config: TrackMenuHeightTransitionConfig,
): MenuHeightTransitionHandle {
  let armedFor: TransitionState | undefined;
  let fromHeight: number | undefined;
  // Whether this handle currently owns the viewport's inline height/
  // transition styles — so apply() knows there's actually something to
  // release once transition goes back to undefined, rather than touching
  // an element it never pinned in the first place.
  let pinned = false;

  function prepare(transition: TransitionState | undefined): void {
    if (!transition || transition.phase !== "start" || transition === armedFor) {
      return;
    }
    armedFor = transition;
    fromHeight = config.getViewportElement()?.getBoundingClientRect().height;
  }

  function apply(transition: TransitionState | undefined): void {
    const viewport = config.getViewportElement();
    if (!viewport) return;

    if (!transition) {
      if (pinned) {
        viewport.style.removeProperty("height");
        viewport.style.removeProperty("transition");
        pinned = false;
      }
      return;
    }

    // Only right after prepare() captured a height for *this* transition —
    // every other update while it's mid-flight (including the later "run"
    // phase flip) falls through here as a no-op, leaving whatever height
    // animation is already in flight alone.
    if (transition !== armedFor || fromHeight === undefined) return;
    const capturedFromHeight = fromHeight;
    armedFor = undefined;
    fromHeight = undefined;

    // The DOM already reflects the incoming page (this runs from updated(),
    // after Lit's patch) — measuring now, before freezing anything, gets its
    // natural settled height.
    const toHeight = viewport.getBoundingClientRect().height;
    viewport.style.transition = "none";
    viewport.style.height = `${capturedFromHeight}px`;
    pinned = true;

    doubleRaf(() => {
      viewport.style.transition = `height ${config.durationMs}ms ease`;
      viewport.style.height = `${toHeight}px`;
    });
  }

  return { prepare, apply };
}
