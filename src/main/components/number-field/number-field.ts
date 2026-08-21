import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import "../button/button.js";
import { plusIcon } from "./icons/plus.icon.js";
import { minusIcon } from "./icons/minus.icon.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

/**
 * A themed `<input type="number">` — min/max/step/required validity comes
 * straight from the native input's own `ValidityState` (rangeUnderflow/
 * rangeOverflow/stepMismatch/valueMissing), the same delegation approach
 * `ui-email-field` uses for its native email-format check, rather than
 * reimplementing numeric range/step logic by hand.
 *
 * The native spin buttons are always suppressed (they render wildly
 * differently across browsers and can't be themed) in favor of two
 * `ui-button` `variant="link"` steppers with their own plus/minus glyphs,
 * driven by `#adjust()` rather than the native `stepUp()`/`stepDown()` —
 * those throw when `step` is `"any"` (this field's own default, see `step`
 * below), so a manual +/-1 (or +/- the configured `step`) is used instead.
 */
@customElement("ui-number-field")
export class NumberField extends LitElement {
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

  // Empty means "any" (arbitrary decimals allowed), not the native default of
  // 1 — the native default would flag ordinary decimal input (e.g. "3.5") as
  // a stepMismatch unless a consumer remembered to opt out of it explicitly,
  // which isn't the sensible default for a general-purpose numeric field.
  @property()
  accessor step = "";

  @property()
  accessor placeholder = "";

  // Hides the +/- stepper buttons entirely — e.g. a compact "go to page"
  // field, where they have no room and clamping is handled by the consumer
  // instead. Off by default, so the stepper buttons show.
  @property({ type: Boolean, reflect: true, attribute: "hide-stepper" })
  accessor hideStepper = false;

  // Centers the value instead of the native start-alignment — e.g. a short
  // "go to page" field, where a left-hugging single/double digit reads
  // oddly next to surrounding centered text.
  @property({ type: Boolean, reflect: true })
  accessor centered = false;

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

        /* size="medium" (the default). Set on :host so a consumer overriding
           this element's font-size from outside scales consistently. */
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

      /* appearance: textfield (plus the ::-webkit-*-spin-button rule below)
         suppresses the native spin buttons unconditionally — they're
         replaced by .stepper's own ui-button pair below (see class doc)
         regardless of hide-stepper, since a themed replacement exists now
         either way. */
      input {
        flex-grow: 1;
        min-width: 0;
        padding: var(--field-padding);
        font-family: var(--ui-font-sans);
        font-size: var(--field-font-size);
        border: none;
        background: transparent;
        color: inherit;
        appearance: textfield;
      }

      :host([centered]) input {
        text-align: center;
      }

      input::placeholder {
        color: var(--ui-color-neutral-400);
        font-weight: 400;
        font-size: var(--field-font-size);
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        appearance: none;
        margin: 0;
      }

      input:focus {
        outline: none;
      }

      /* The two steppers sit right after the input, inside the same bordered
         wrapper — sized down from the field's own font-size (ui-button's
         default padding/font-size would otherwise dwarf a "small" field) and
         packed edge-to-edge with no gap, reading as one horizontal pair
         rather than two separate buttons. */
      .stepper {
        display: flex;
        flex: none;
        padding-inline-end: calc(var(--field-padding) / 2);
        --btn-font-size: calc(var(--field-font-size) * 0.85);
        --btn-padding-block: 0.15em;
        --btn-padding-inline: 0.3em;
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
      changed.has("step")
    ) {
      this.#syncValidity();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  // Delegates to the internal <input type="number">'s own ValidityState, so
  // the browser's native range/step checks (rangeUnderflow/rangeOverflow/
  // stepMismatch) are reused rather than reimplemented.
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

  // 1 when `step` is unset/"any" (this field's own default) — matches what a
  // consumer typing decimals expects the buttons to do with nothing
  // configured, same as the native stepper's own fallback.
  #stepAmount(): number {
    const parsed = parseFloat(this.step);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  // How many decimals the result is rounded to — derived from `step` (falling
  // back to the same "1" #stepAmount() defaults to) so e.g. step="0.1" keeps
  // landing on exact tenths instead of drifting via binary-float rounding
  // (0.1 + 0.2 territory).
  #decimalPlaces(): number {
    const source = this.step || "1";
    const dot = source.indexOf(".");
    return dot === -1 ? 0 : source.length - dot - 1;
  }

  #numericValue(): number | undefined {
    const parsed = parseFloat(this.value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  #isDecrementDisabled(): boolean {
    if (this.disabled || this.readonly) return true;
    const min = parseFloat(this.min);
    const current = this.#numericValue();
    return Number.isFinite(min) && current !== undefined && current <= min;
  }

  #isIncrementDisabled(): boolean {
    if (this.disabled || this.readonly) return true;
    const max = parseFloat(this.max);
    const current = this.#numericValue();
    return Number.isFinite(max) && current !== undefined && current >= max;
  }

  // Reimplements native stepUp()/stepDown() clamping by hand rather than
  // calling them directly — both throw an InvalidStateError when `step` is
  // "any", which is this field's own default (see the `step` doc above).
  #adjust(direction: 1 | -1) {
    if (this.disabled || this.readonly) return;

    let next = (this.#numericValue() ?? 0) + direction * this.#stepAmount();

    const min = parseFloat(this.min);
    if (Number.isFinite(min)) next = Math.max(next, min);

    const max = parseFloat(this.max);
    if (Number.isFinite(max)) next = Math.min(next, max);

    this.value = next.toFixed(this.#decimalPlaces());

    if (this.#input) {
      this.#input.value = this.value;
    }

    this.#syncFormValue();
    this.#syncValidity();

    this.dispatchEvent(
      new InputEvent("input", { bubbles: true, composed: true }),
    );
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
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
          type="number"
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          min=${this.min}
          max=${this.max}
          step=${this.step || "any"}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        ${this.hideStepper
          ? nothing
          : html`
              <div class="stepper">
                <ui-button
                  variant="link"
                  aria-label="Decrement"
                  ?disabled=${this.#isDecrementDisabled()}
                  @click=${() => this.#adjust(-1)}
                >
                  ${minusIcon}
                </ui-button>
                <ui-button
                  variant="link"
                  aria-label="Increment"
                  ?disabled=${this.#isIncrementDisabled()}
                  @click=${() => this.#adjust(1)}
                >
                  ${plusIcon}
                </ui-button>
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-number-field": NumberField;
  }
}
