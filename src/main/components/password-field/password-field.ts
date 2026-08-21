import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { eyeIcon } from "./icons/eye.icon.js";
import { eyeSlashIcon } from "./icons/eye-slash.icon.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

@customElement("ui-password-field")
export class PasswordField extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;

  @property()
  accessor name = "";

  // Renders as a real <label for="input"> above the field when set — its own
  // accessible name and click-to-focus, no ARIA wiring needed on our part.
  @property()
  accessor label = "";

  @property()
  accessor value = "";

  // Default to "off": autocomplete's native default ("on") is rarely what a form
  // actually wants.
  @property()
  accessor autocomplete = "off";

  @property({ type: Boolean })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ type: Boolean })
  accessor readonly = false;

  @property({ type: Number })
  accessor minlength: number | undefined = undefined;

  @property({ type: Number })
  accessor maxlength: number | undefined = undefined;

  @property()
  accessor placeholder = "";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  #visible = false;
  #spellcheckDefaulted = false;

  constructor() {
    super();

    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.#spellcheckDefaulted) {
      this.#spellcheckDefaulted = true;
      // `spellcheck` is a native HTMLElement property/attribute (default
      // true); flip the default here, not the constructor — see
      // ui-text-field's own connectedCallback for why (constructor
      // invariant violation when created from within another custom
      // element's reaction). Guarded so a later reconnect never clobbers a
      // consumer's own explicit override.
      this.spellcheck = false;
    }
  }

  static styles = [
    defaultTheme,
    fieldLabelStyles,
    css`
      :host {
        font-weight: var(--ui-font-weight-normal);
        display: block;

        /* size="medium" (the default). Set on :host (not just the input) so
           .toggle, which inherits ambient font-size rather than the input's
           own, scales the same way. */
        font-size: var(--field-font-size);
        --field-font-size: var(--ui-font-size-md);
        /* Was 0.25rem (same as small below) at one point — collapsed medium
           and small to the same overall height, which read as broken rather
           than "compact". 0.4rem keeps a real, visible step between all
           three sizes. */
        --field-padding: 0.4rem;
      }

      :host([size="small"]) {
        --field-font-size: var(--ui-font-size-sm);
        --field-padding: 0.25rem;
      }

      :host([size="large"]) {
        --field-font-size: var(--ui-font-size-lg);
        --field-padding: 0.55rem;
      }

      /* The border lives on the wrapper, surrounding both the input and the
         toggle button; the input itself stays borderless so the two read as
         one control. */
      .wrapper {
        display: flex;
        align-items: center;
        border: var(--ui-border-thin) solid var(--ui-field-border-color);
        border-radius: var(--ui-field-radius);
        background: var(--ui-bg);
        box-sizing: border-box;
      }

      .wrapper:focus-within {
        outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
        outline-offset: var(--ui-focus-ring-offset);
      }

      input {
        flex-grow: 1;
        min-width: 0;
        padding: var(--field-padding);
        font-family: var(--ui-font-sans);
        font-size: var(--field-font-size);
        border: none;
        background: transparent;
        color: inherit;
      }

      input::placeholder {
        color: var(--ui-color-neutral-400);
        font-weight: 400;
        font-size: var(--field-font-size);
      }

      input:focus {
        outline: none;
      }

      .toggle {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-inline: 0.25rem var(--field-padding);
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1em;
      }

      .toggle:disabled {
        cursor: default;
        opacity: 0.5;
      }

      :host([invalid]) .wrapper {
        border-color: var(--ui-color-danger-500);
      }
    `,
  ];

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;
    this.#syncFormValue();
    this.#syncValidity();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value") || changed.has("disabled")) {
      this.#syncFormValue();
    }

    if (
      changed.has("required") ||
      changed.has("minlength") ||
      changed.has("maxlength")
    ) {
      this.#syncValidity();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  #syncValidity() {
    if (!this.#input) {
      return;
    }

    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && !this.value) {
      flags.valueMissing = true;
      message = "This field is required.";
    }

    if (this.minlength !== undefined && this.value.length < this.minlength) {
      flags.tooShort = true;
      message = `Minimum length is ${this.minlength}.`;
    }

    if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      flags.tooLong = true;
      message = `Maximum length is ${this.maxlength}.`;
    }

    this.#internals.setValidity(flags, message, this.#input);

    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  #onInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    this.value = input.value;

    this.#syncFormValue();
    this.#syncValidity();

    this.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  #toggleVisibility() {
    if (this.disabled) {
      return;
    }

    this.#visible = !this.#visible;

    if (this.#input) {
      this.#input.type = this.#visible ? "text" : "password";
    }

    this.requestUpdate();
  }

  formResetCallback() {
    this.value = "";

    if (this.#input) {
      this.#input.value = "";
    }

    this.#syncFormValue();
    this.#syncValidity();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") {
      this.value = state;

      if (this.#input) {
        this.#input.value = state;
      }

      this.#syncFormValue();
    }
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    if (message) {
      this.#internals.setValidity(
        {
          customError: true,
        },
        message,
        this.#input,
      );
    } else {
      this.#syncValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  render() {
    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <input
          id="input"
          .value=${this.value}
          name=${this.name}
          placeholder=${this.placeholder}
          autocomplete=${this.autocomplete}
          spellcheck=${this.spellcheck}
          type=${this.#visible ? "text" : "password"}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          minlength=${this.minlength ?? ""}
          maxlength=${this.maxlength ?? ""}
          @input=${this.#onInput}
        />

        <button
          type="button"
          class="toggle"
          aria-label=${this.#visible ? "Hide password" : "Show password"}
          aria-pressed=${this.#visible}
          ?disabled=${this.disabled}
          @click=${this.#toggleVisibility}
        >
          ${this.#visible ? eyeSlashIcon : eyeIcon}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-password-field": PasswordField;
  }
}
