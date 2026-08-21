// Makes `<label for="x">` … `<ui-something id="x">` behave the way it does for
// a native form control.
//
// Every component here is form-associated (`static formAssociated = true`),
// which already makes it a *labelable* element: the association itself is real
// (`label.control` resolves to the host, and assistive tech takes the host's
// accessible name from the label text) with no help from us. What the platform
// does not do is the next step. Label activation's "focus the labeled control"
// behavior is defined for native controls only; a form-associated custom
// element gets the label's click forwarded to it and nothing else. And that
// click can't be picked up where a component would naturally handle it — on the
// `<input>`/trigger inside its shadow root — because it targets the *host*, and
// a host-targeted click never descends into a shadow tree.
//
// So the last step is done by hand: call this from a component's constructor,
// and a click on its label lands focus on whatever its own `focus()` focuses.
//
// Deliberately not a Lit mixin or a base class — nothing here needs the
// reactive lifecycle, and the components already differ in what they extend
// and how they resolve their inner control. One call in the constructor keeps
// each component's own `focus()` as the single definition of "where focus goes".

/**
 * The bit of a host this needs: something focusable that may be disabled.
 * `focus()` is expected to be overridden to delegate to the component's own
 * inner control (every component wired up here does this) — `focusVisible` is
 * forwarded to it, so a component whose inner control ignores the option (a
 * third-party editor instance, say) simply focuses without the ring.
 */
export interface LabelFocusHost extends HTMLElement {
  disabled?: boolean;
  readonly?: boolean;
}

/**
 * Forwards an associated `<label>`'s click to `host.focus()`.
 *
 * `action`, when given, replaces the focus call — for a control whose label
 * click should *do* something rather than just focus it (a checkbox toggles;
 * see ui-checkbox), since forwarding the click to the inner control gets both
 * the state change and the focus in one go, exactly as the native element
 * would.
 */
export function focusOnLabelClick(
  host: LabelFocusHost,
  action?: () => void,
): void {
  host.addEventListener("click", (event: MouseEvent) => {
    // The one discriminator that matters: a click on the inner control (or any
    // other shadow content) starts *inside* the shadow root and only retargets
    // to the host on its way out, so composedPath()[0] is that inner node, not
    // the host. A label's activation click — and a plain programmatic
    // host.click() — genuinely targets the host. Without this guard, every
    // ordinary click would be handled twice: once by the component's own inner
    // handler, once again here.
    if (event.composedPath()[0] !== host) return;
    if (host.disabled) return;

    if (action) {
      action();
      return;
    }

    // focusVisible: true, not a bare focus(): a control that only draws its
    // ring under :focus-visible (all of ours) won't match it for a
    // programmatic focus() made from inside a pointer event, so the control
    // would take focus with nothing on screen saying so — indistinguishable
    // from the click having done nothing. A native <select>/<input> *does*
    // light up when its own label is clicked (measured against one), so this
    // matches the platform rather than over-styling.
    host.focus({ focusVisible: true });
  });
}
