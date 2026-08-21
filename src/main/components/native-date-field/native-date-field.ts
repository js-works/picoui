import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

/**
 * A themed wrapper around the browser's own native date picker — `<input
 * type="date">` or, with `type="datetime-local"`, its date+time variant.
 * Unlike `ui-date-field` (which renders a calendar of its own), this one has
 * no picker UI of its own: the browser's native picker affordance
 * (the small calendar icon Chromium/Firefox/Safari all render inside the
 * input) is what opens it, so there's nothing to theme beyond the input's own
 * border/background/font — the picker popup itself is native chrome outside
 * this element's control.
 *
 * min/max/step/required validity comes straight from the native input's own
 * `ValidityState` (rangeUnderflow/rangeOverflow/stepMismatch/valueMissing/
 * badInput for an unparseable typed value) — same delegation approach
 * `ui-email-field`/`ui-number-field` use for their own native format/range
 * checks, rather than reimplementing date comparison by hand.
 */
@customElement("ui-native-date-field")
export class NativeDateField extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;

  @property()
  accessor name = "";

  // Renders as a real <label for="input"> above the field when set — its own
  // accessible name and click-to-focus, no ARIA wiring needed on our part.
  @property()
  accessor label = "";

  // ISO format matching whichever `type` is active — yyyy-mm-dd for "date",
  // yyyy-mm-ddThh:mm for "datetime-local" — same as the underlying native
  // input's own `.value`, and unambiguous regardless of locale.
  @property()
  accessor value = "";

  @property()
  accessor type: "date" | "datetime-local" = "date";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ type: Boolean })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ type: Boolean })
  accessor readonly = false;

  @property()
  accessor min = "";

  @property()
  accessor max = "";

  @property()
  accessor step = "";

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  static styles = [
    defaultTheme,
    fieldLabelStyles,
    css`
      :host {
        font-weight: var(--ui-font-weight-normal);
        display: block;

        /* size="medium" (the default). */
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
        /* No color-scheme declaration here on purpose, even though this is
           the one field whose UA-rendered internals (the picker icon, the
           date segments' selection highlight, the dropdown calendar) depend
           on it. An earlier version pinned \`light dark\` locally to stop the
           icon rendering as a fixed dark gray — but pinning it means this
           field always follows the *OS* preference and silently ignores a
           consumer forcing a scheme on <html>. color-scheme is an inherited
           property that themes/theme.ts deliberately declares only on :root
           (see its comment there), so leaving it alone is what lets it reach
           through this shadow boundary and stay in step with everything
           else. */
      }

      input:focus {
        outline: none;
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
      changed.has("min") ||
      changed.has("max") ||
      changed.has("step") ||
      changed.has("type")
    ) {
      this.#syncValidity();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  // Delegates to the internal <input>'s own ValidityState, so the browser's
  // native date/date-time checks (rangeUnderflow/rangeOverflow/
  // stepMismatch/badInput) are reused rather than reimplemented.
  #syncValidity() {
    if (!this.#input) return;

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

  // Native browser affordance (Chromium/Firefox/Safari all support this) to
  // programmatically open the picker — mirrors `ui-date-field`'s own trigger
  // button, without needing one here since the native input already renders
  // its own picker-icon affordance.
  showPicker() {
    this.#input?.showPicker();
  }

  render() {
    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <input
          id="input"
          .value=${this.value}
          name=${this.name}
          type=${this.type}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-native-date-field": NativeDateField;
  }
}
