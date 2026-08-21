export { doubleRaf };

// Runs `callback` two animation frames from now. Used by
// menu-button.ts/split-button.ts's `updated()` to flip a freshly-started
// page transition (menu-core.ts's TransitionState.phase, "start" -> "run")
// after the browser has had a chance to actually paint the "start" position
// first — a single rAF sometimes lands in the same paint as the DOM update
// that set the "start" styles (Chrome/Safari differ on this), which would
// coalesce start+end into one frame and skip the transition entirely; two
// nested frames reliably guarantee a real paint happens in between.
function doubleRaf(callback: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback);
  });
}
