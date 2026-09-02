import { html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { FieldElement } from "../base/field-element.js";
import { fieldStyles } from "../base/field.styles.js";
import type { FieldConfig } from "../base/field-element.js";
import type { FieldValidity } from "../base/form-control-core.js";
import { calendarIcon } from "../icons/icons.js";

type Mode = "date" | "dateTime";

const EMPTY: FieldValidity = { flags: {}, message: "" };

const PATTERN: Record<Mode, RegExp> = {
  date: /^(\d{4})-(\d{2})-(\d{2})$/,
  dateTime: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
};

// `value` stays canonical ISO (`…Thh:mm`); the text input shows/accepts a
// space in place of the `T`.
const toDisplay = (value: string) => value.replace("T", " ");
const toCanonical = (value: string) => value.replace(" ", "T");

// A complete, real ISO value for the mode — `yyyy-mm-dd`, or `…Thh:mm`.
function isComplete(value: string, mode: Mode): boolean {
  const m = PATTERN[mode].exec(value);
  if (!m) return false;
  const [, y, mo, d, h = "0", mi = "0"] = m;
  const [year, month, day, hour, minute] = [y, mo, d, h, mi].map(Number);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return false;
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

// Pull the picked value out of the hidden native input and onto the visible
// one, then let it flow through the base's normal input/change delegation.
function commitFromNative(host: DateField): void {
  const text = host.renderRoot.querySelector<HTMLInputElement>("input.text");
  const native =
    host.renderRoot.querySelector<HTMLInputElement>("input.native");
  if (!text || !native) return;
  text.value = toDisplay(native.value);
  text.dispatchEvent(new Event("input", { bubbles: true }));
  text.dispatchEvent(new Event("change", { bubbles: true }));
}

const config: FieldConfig<DateField> = {
  // The visible text input is the control — its value is `value`, typed or
  // picked. The hidden native input is only the picker target.
  controlSelector: "input.text",

  readValue: (_host, control) => toCanonical(control.value),

  computeValidity: (host): FieldValidity => {
    const { value, selectionMode: mode, min, max } = host;
    if (host.required && !value) {
      return {
        flags: { valueMissing: true },
        message: "This field is required.",
      };
    }
    if (!value) return EMPTY;
    if (!isComplete(value, mode)) {
      return {
        flags: { badInput: true },
        message:
          mode === "dateTime"
            ? "Enter a date and time as YYYY-MM-DD hh:mm."
            : "Enter a date as YYYY-MM-DD.",
      };
    }
    // ISO strings compare lexically; a `yyyy-mm-dd` bound on a dateTime value
    // therefore bounds the day.
    if (min && value < min) {
      return {
        flags: { rangeUnderflow: true },
        message: `Must be on or after ${min}.`,
      };
    }
    if (max && value > max) {
      return {
        flags: { rangeOverflow: true },
        message: `Must be on or before ${max}.`,
      };
    }
    return EMPTY;
  },

  renderControl: (host, ids) => {
    const interactive = !host.disabled && !host.readonly;
    return html`
      <input
        id=${ids.control}
        class="text"
        type="text"
        autocomplete="off"
        spellcheck="false"
        .value=${toDisplay(host.value)}
        placeholder=${host.placeholder}
        aria-describedby=${ids.describedBy ?? nothing}
        aria-haspopup="dialog"
        ?disabled=${host.disabled}
        ?readonly=${host.readonly}
        @keydown=${(event: KeyboardEvent) => {
          if (interactive && event.key === "ArrowDown") {
            event.preventDefault();
            host.showPicker();
          }
        }}
      />
      <input
        class="native"
        aria-hidden="true"
        tabindex="-1"
        type=${host.selectionMode === "dateTime" ? "datetime-local" : "date"}
        .value=${isComplete(host.value, host.selectionMode) ? host.value : ""}
        min=${host.min || nothing}
        max=${host.max || nothing}
        step=${host.step || nothing}
        @input=${(event: Event) => {
          event.stopPropagation();
          commitFromNative(host);
        }}
        @change=${(event: Event) => event.stopPropagation()}
      />
      ${
        interactive
          ? html`<button
              type="button"
              class="picker"
              tabindex="-1"
              aria-label="Open date picker"
              @click=${() => host.showPicker()}
            >
              ${calendarIcon}
            </button>`
          : nothing
      }
    `;
  },
};

/**
 * A themed date field with an editable text input plus a calendar button. The
 * text is a free `<input type="text">` accepting `yyyy-mm-dd`, or
 * `yyyy-mm-dd hh:mm` for `selection-mode="dateTime"`. `value` stays canonical
 * ISO (`yyyy-mm-ddThh:mm`); only the display swaps the `T` for a space.
 * Format / range validity is checked here.
 *
 * The browser's own `<input type="date">` is kept visually hidden and used
 * only as the `showPicker()` target (opened by the button, or ArrowDown in the
 * text input); a pick flows back into the text input. Keeping it off-screen
 * means none of its per-browser chrome ever has to be fought.
 */
@customElement("uu-date-field")
export class DateField extends FieldElement {
  @property({ attribute: "selection-mode" })
  accessor selectionMode: Mode = "date";

  @property()
  accessor min = "";

  @property()
  accessor max = "";

  @property()
  accessor step = "";

  static styles = [
    ...fieldStyles,
    css`
      .wrapper {
        position: relative;
      }

      /* Invisible and click-through, but stretched over the whole field so the
         native picker popup anchors to the field's box (opening aligned with
         it) rather than to a corner. Still rendered, so showPicker() works. */
      input.native {
        position: absolute;
        inset: 0;
        padding: 0;
        border: 0;
        opacity: 0;
        pointer-events: none;
      }

      .picker {
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
    `,
  ];

  constructor() {
    super(config);
  }

  showPicker() {
    if (this.disabled || this.readonly) return;
    this.renderRoot
      .querySelector<HTMLInputElement>("input.native")
      ?.showPicker();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-date-field": DateField;
  }
}
