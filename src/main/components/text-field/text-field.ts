import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

@customElement("ui-text-field")
export class TextField extends LitElement {
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

  @property()
  accessor type: HTMLInputElement["type"] = "text";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

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
  accessor pattern = "";

  @property()
  accessor placeholder = "";

  // Default to "off": autocomplete's native default ("on") is rarely what a form
  // actually wants.
  @property()
  accessor autocomplete = "off";

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
      // true); flip the default here rather than redeclaring it as a
      // reactive property (its type is fixed to boolean by the platform,
      // and it rarely needs to react to changes). Not in the constructor —
      // setting it there sets the attribute during construction, which
      // violates the custom element constructor invariants the platform
      // enforces strictly when this element is created from within
      // another custom element's own reaction (e.g. ui-datagrid's column
      // filter calling `document.createElement("ui-text-field")` from
      // inside its own `firstUpdated()`), throwing "NotSupportedError:
      // ...createElement... result must not have attributes". Guarded so a
      // later reconnect never clobbers a consumer's own explicit override.
      this.spellcheck = false;
    }
  }

  static styles = [
    defaultTheme,
    fieldLabelStyles,
    css`
      :host {
        font-weight: var(--ui-font-weight-normal);
        display: flex;
        /* Column, not the single-row layout this used to be — harmless when
           there's only one child (.wrapper, same as before), but lets the new
           optional .field-label stack above it instead of sitting beside it. */
        flex-direction: column;

        /* size="medium" (the default). Set on :host (not just the input) so
           slotted prefix/suffix content, which inherits ambient font-size
           rather than the input's own, scales the same way. */
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

      .wrapper {
        display: flex;
        align-items: center;
        flex-grow: 1;
        box-sizing: border-box;
        /* Per-side custom properties (rather than one border shorthand) so a
           consumer can drop individual sides — e.g. a global filter field
           styled bottom-border-only — via a plain custom-property override
           from outside, without reaching into the shadow root. */
        border-block-start: var(
          --field-border-block-start,
          var(--ui-border-thin) solid var(--ui-field-border-color)
        );
        border-inline: var(
          --field-border-inline,
          var(--ui-border-thin) solid var(--ui-field-border-color)
        );
        border-block-end: var(
          --field-border-block-end,
          var(--ui-border-thin) solid var(--ui-field-border-color)
        );
        border-radius: var(--field-border-radius, var(--ui-field-radius));
        background: var(--ui-bg);
      }

      :host([invalid]) .wrapper {
        border-color: var(--ui-color-danger-500);
      }

      .wrapper:focus-within {
        outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
        outline-offset: var(--ui-focus-ring-offset);
      }

      input {
        flex-grow: 1;
        min-width: 0;
        font-family: var(--ui-font-sans);
        font-size: var(--field-font-size);
        padding: var(--field-padding);
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

      /* Only styled/spaced when something is actually assigned — an empty slot
         has no assigned nodes for ::slotted to match, so it contributes zero
         width/space on its own (no leftover gap for an unused slot). */
      ::slotted([slot="prefix"]),
      ::slotted([slot="suffix"]) {
        display: flex;
        align-items: center;
        flex: none;
        color: var(--ui-color-neutral-700);
      }

      ::slotted([slot="prefix"]) {
        margin-inline-start: 0.5rem;
      }

      ::slotted([slot="suffix"]) {
        margin-inline-end: 0.5rem;
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
      changed.has("maxlength") ||
      changed.has("pattern")
    ) {
      this.#syncValidity();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  #syncValidity() {
    if (!this.#input) return;

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

    if (
      this.pattern &&
      this.value &&
      !new RegExp(this.pattern).test(this.value)
    ) {
      flags.patternMismatch = true;
      message = "Invalid format.";
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
        <slot name="prefix"></slot>
        <input
          id="input"
          .value=${this.value}
          name=${this.name}
          type=${this.type}
          placeholder=${this.placeholder}
          autocomplete=${this.autocomplete}
          spellcheck=${this.spellcheck}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          minlength=${this.minlength ?? ""}
          maxlength=${this.maxlength ?? ""}
          pattern=${this.pattern}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        <slot name="suffix"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-text-field": TextField;
  }
}
