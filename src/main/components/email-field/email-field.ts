import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { emailIcon } from "./icons/email.icon.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

@customElement("ui-email-field")
export class EmailField extends LitElement {
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

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

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
           .icon, which inherits ambient font-size rather than the input's
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

      /* The border lives on the wrapper, surrounding both the input and the icon;
         the input itself stays borderless so the two read as one control. */
      .wrapper {
        display: flex;
        align-items: center;
        border: var(--ui-border-thin) solid var(--ui-field-border-color);
        border-radius: var(--ui-field-radius);
        box-sizing: border-box;
      }

      input {
        flex-grow: 1;
        min-width: 0;
        padding: var(--field-padding);
        font-family: var(--ui-font-sans);
        font-size: var(--field-font-size);
        border: none;
        background: transparent;
      }

      input::placeholder {
        color: var(--ui-color-neutral-400);
        font-weight: 400;
        font-size: var(--field-font-size);
      }

      input:focus {
        outline: none;
      }

      .wrapper:focus-within {
        outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
        outline-offset: var(--ui-focus-ring-offset);
      }

      .icon {
        flex: none;
        display: flex;
        align-items: center;
        padding-inline-end: 0.5rem;
        font-size: 1em;
        color: inherit;
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

  // Delegates to the internal <input type="email">'s own ValidityState, so the
  // browser's native email-format check (typeMismatch) is reused rather than
  // reimplemented.
  #syncValidity() {
    if (!this.#input) {
      return;
    }

    this.#internals.setValidity(
      this.#input.validity,
      this.#input.validationMessage,
      this.#input,
    );

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

  #onChange() {
    this.dispatchEvent(
      new Event("change", {
        bubbles: true,
        composed: true,
      }),
    );
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
      this.#internals.setValidity({ customError: true }, message, this.#input);
    } else {
      this.#syncValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  select() {
    this.#input?.select();
  }

  render() {
    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <input
          id="input"
          .value=${this.value}
          name=${this.name}
          type="email"
          placeholder=${this.placeholder}
          autocomplete=${this.autocomplete}
          spellcheck=${this.spellcheck}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          minlength=${this.minlength ?? ""}
          maxlength=${this.maxlength ?? ""}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        <span class="icon">${emailIcon}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-email-field": EmailField;
  }
}
