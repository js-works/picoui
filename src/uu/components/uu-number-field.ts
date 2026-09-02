import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FieldElement } from "../base/field-element.js";
import { fieldStyles } from "../base/field.styles.js";
import { nativeValidity } from "../base/field-helpers.js";
import type { FieldConfig } from "../base/field-element.js";
import { plusIcon, minusIcon } from "../icons/icons.js";

const config: FieldConfig<NumberField> = {
  controlSelector: "input",
  computeValidity: nativeValidity,
  renderControl: (host, ids) => html`
    <input
      id=${ids.control}
      .value=${host.value}
      name=${host.name}
      type="number"
      placeholder=${host.placeholder}
      aria-describedby=${ids.describedBy ?? nothing}
      ?disabled=${host.disabled}
      ?required=${host.required}
      ?readonly=${host.readonly}
      min=${host.min || nothing}
      max=${host.max || nothing}
      step=${host.step || "any"}
    />
    ${
      host.hideStepper
        ? nothing
        : html`
            <div class="stepper">
              <button
                type="button"
                tabindex="-1"
                aria-label="Decrement"
                ?disabled=${host.disabled || host.readonly || atBound(host, -1)}
                @click=${() => adjust(host, -1)}
              >
                ${minusIcon}
              </button>
              <button
                type="button"
                tabindex="-1"
                aria-label="Increment"
                ?disabled=${host.disabled || host.readonly || atBound(host, 1)}
                @click=${() => adjust(host, 1)}
              >
                ${plusIcon}
              </button>
            </div>
          `
    }
  `,
};

/**
 * A themed `<input type="number">`. Range/step validity comes from the native
 * input's own ValidityState. The native spin buttons are always suppressed
 * (unthemeable, wildly cross-browser) in favor of a `+`/`−` pair driven by
 * `adjust()` — `step="any"` (this field's default, so plain decimals aren't
 * flagged as a step mismatch) makes the native `stepUp()`/`stepDown()` throw,
 * so the arithmetic is done by hand.
 */
@customElement("uu-number-field")
export class NumberField extends FieldElement {
  @property()
  accessor min = "";

  @property()
  accessor max = "";

  @property()
  accessor step = "";

  @property({ type: Boolean, reflect: true, attribute: "hide-stepper" })
  accessor hideStepper = false;

  @property({ type: Boolean, reflect: true })
  accessor centered = false;

  static styles = [
    ...fieldStyles,
    css`
      input {
        appearance: textfield;
      }

      :host([centered]) input {
        text-align: center;
      }

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        appearance: none;
        margin: 0;
      }

      .stepper {
        display: flex;
        flex: none;
        padding-inline-end: calc(var(--field-padding) / 2);
      }

      .stepper button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.15em 0.3em;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: calc(var(--field-font-size) * 0.85);
      }

      .stepper button:disabled {
        cursor: default;
        opacity: 0.4;
      }
    `,
  ];

  constructor() {
    super(config);
  }
}

function numeric(value: string): number | undefined {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stepAmount(step: string): number {
  const parsed = parseFloat(step);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function decimalPlaces(step: string): number {
  const source = step || "1";
  const dot = source.indexOf(".");
  return dot === -1 ? 0 : source.length - dot - 1;
}

// Would stepping in `direction` land past a configured bound (or already be
// there)? Only limits when the relevant bound and the current value are both
// finite numbers — an empty field can still be stepped off zero.
function atBound(host: NumberField, direction: 1 | -1): boolean {
  const current = numeric(host.value);
  if (current === undefined) return false;
  const bound = parseFloat(direction === -1 ? host.min : host.max);
  if (!Number.isFinite(bound)) return false;
  return direction === -1 ? current <= bound : current >= bound;
}

function adjust(host: NumberField, direction: 1 | -1): void {
  if (host.disabled || host.readonly) return;

  let next = (numeric(host.value) ?? 0) + direction * stepAmount(host.step);
  const min = parseFloat(host.min);
  if (Number.isFinite(min)) next = Math.max(next, min);
  const max = parseFloat(host.max);
  if (Number.isFinite(max)) next = Math.min(next, max);

  const input = host.renderRoot.querySelector("input");
  if (!input) return;
  input.value = next.toFixed(decimalPlaces(host.step));
  // Bubbles within the shadow tree to `.wrapper`, where the base's delegated
  // handlers pick it up (pull the value onto the host, sync form state,
  // re-dispatch a composed event) — the same path a keystroke takes.
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-number-field": NumberField;
  }
}
