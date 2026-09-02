import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { TemplateResult } from "lit";

import { formControlStyles } from "./form-control.styles.js";
import { FormControlController } from "./form-control-core.js";
import type {
  FormControlConfig,
  FormRestoreState,
} from "./form-control-core.js";

// Shadow-DOM-scoped ids: the control the `<label for>` points at, and the
// message element the control's `aria-describedby` points at. Both live in
// this element's own shadow root, so plain constants suffice.
const CONTROL_ID = "control";
const MESSAGE_ID = "message";

/**
 * The base every form-associated control extends — form participation, the
 * `name` / `disabled` / `required` surface, constraint-validation API, the
 * info/error message row, and label-click-to-focus. All behavior lives in a
 * `FormControlController` this constructs and keeps `#private`.
 *
 * It owns no layout: `render()` delegates to `config.render`, handing it the
 * message row and the base's own input/change handlers. A field draws a
 * bordered box; a checkbox will draw something else; both reuse everything
 * else here.
 *
 * Abstract — never registered as a custom element itself.
 */
export abstract class FormControlElement extends LitElement {
  static readonly formAssociated = true;

  static readonly styles = formControlStyles;

  readonly #internals: ElementInternals;
  readonly #core: FormControlController;
  readonly #config: FormControlConfig;

  @property()
  accessor name = "";

  @property()
  accessor label = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  // Help text below the control (muted). Wired to the control via
  // `aria-describedby` when no `errorText` is set.
  @property({ attribute: "info-text" })
  accessor infoText = "";

  // An explicit error message below the control (danger-colored). While set it
  // also forces the `invalid` attribute for styling. It does NOT push
  // `customError` into ElementInternals — submission is still governed by the
  // control's own validity (`computeValidity` / `setCustomValidity`).
  @property({ attribute: "error-text" })
  accessor errorText = "";

  // `config` is built in the subclass layer's own file and threaded straight
  // through `super()` — its callbacks take the host as an argument, never
  // closing over `this`, so nothing internal lands on the element surface.
  constructor(config: FormControlConfig) {
    super();
    this.#internals = this.attachInternals();
    this.#config = config;
    this.#core = new FormControlController(this, this.#internals, config);
    this.#forwardLabelClick();
  }

  // The platform makes a form-associated element labelable (the `<label for>`
  // association, accessible name) but not a native control's label-click-to-
  // focus: the label's click is forwarded to the host and stops there, never
  // descending into the shadow root. So do that last step by hand.
  #forwardLabelClick() {
    this.addEventListener("click", (event) => {
      // A click on shadow content retargets to the host only on its way out,
      // so composedPath()[0] is that inner node; a label activation click (or
      // a bare host.click()) genuinely targets the host.
      if (event.composedPath()[0] !== this || this.disabled) return;
      // focusVisible: our controls only ring under :focus-visible, which a
      // programmatic focus() from inside a pointer event won't match — yet a
      // native field *does* light up when its own label is clicked.
      this.focus({ focusVisible: true });
    });
  }

  protected firstUpdated() {
    this.#core.mounted();
  }

  protected updated() {
    this.#core.hostUpdated();
  }

  // --- public API ------------------------------------------------------

  checkValidity() {
    return this.#core.checkValidity();
  }

  reportValidity() {
    return this.#core.reportValidity();
  }

  setCustomValidity(message: string) {
    this.#core.setCustomValidity(message);
  }

  // --- form lifecycle -------------------------------------------------

  formResetCallback() {
    this.#core.formReset();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: FormRestoreState) {
    this.#core.formRestore(state);
  }

  // --- rendering ----------------------------------------------------

  readonly #onControlInput = () => {
    if (this.disabled) return;
    this.#config.onControlInput?.(this);
    this.#core.syncFormValue();
    this.#core.syncValidity();
    this.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );
  };

  readonly #onControlChange = () => {
    if (this.disabled) return;
    this.#config.onControlChange?.(this);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  #renderMessages(): TemplateResult {
    if (this.errorText) {
      return html`<div class="message error" id=${MESSAGE_ID}>
        ${this.errorText}
      </div>`;
    }
    if (this.infoText) {
      return html`<div class="message info" id=${MESSAGE_ID}>
        ${this.infoText}
      </div>`;
    }
    return html``;
  }

  render(): TemplateResult {
    return this.#config.render(this, {
      controlId: CONTROL_ID,
      describedBy: this.errorText || this.infoText ? MESSAGE_ID : undefined,
      messages: this.#renderMessages(),
      onControlInput: this.#onControlInput,
      onControlChange: this.#onControlChange,
    });
  }
}
