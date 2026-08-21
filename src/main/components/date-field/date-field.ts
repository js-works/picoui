import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { dateFieldStyles } from "./date-field.styles.js";
import { FIELD_ICONS } from "./icons.js";
import { formatFieldValue, type DateFieldSelectionMode } from "./format.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";
import { closestLang, observeLocale } from "../../shared/locale.js";
import "../date-picker/date-picker.js";
import type { DatePicker } from "../date-picker/date-picker.js";
import "../button/button.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

export type { DateFieldSelectionMode };

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// Local midnight, not `new Date(iso)` — see format.ts's note on why the bare
// date form must not go through the spec's UTC parse.
function parseIsoDay(value: string): Date | null {
  if (!ISO_DAY.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // Round-trip check, so a well-formed impossible date ("2026-02-31", which
  // Date silently rolls forward to March 3rd) is rejected instead of shifting.
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

/**
 * A date field with a calendar popup, built on `ui-date-picker` (and so on that
 * component's framework-free core — see date-picker/vanilla/).
 *
 * Covers every one of the picker's single/range selection modes through
 * `selection-mode`: a plain date, a date and time, a week, a month, a quarter,
 * a year, and a range of each. The picker's multi-select modes (`dates`,
 * `weeks`, `months`, `quarters`, `years`) are deliberately *not* offered — a
 * one-line field is the wrong shape for an open-ended set, and there'd be no
 * sensible display text for it. Use `ui-date-picker` directly for those.
 *
 * `value` is the picker core's own raw string, unchanged: `2026-08-01`,
 * `2026-08-01T14:30`, `2026-W32`, `2026-Q3`, `2026-08-01,2026-08-09`, … — see
 * format.ts for the full table. It's locale-independent and stable, which is
 * what makes it the right thing to put in a form. The *displayed* text is that
 * value run through `Intl` for the field's language (see format.ts), so it
 * follows `lang` and updates when `lang` changes.
 *
 * The text input is read-only on purpose: there's no sane free-text entry for a
 * week, a quarter or a range, so the picker popup is the single way in.
 *
 * The popup commits on **OK** rather than on click, so a range can be picked
 * without the field churning through half-selected states — **Cancel** discards
 * and **Clear** empties. It has no header of its own: the picker already shows
 * the selection (a highlighted cell, or the time view's own readout), so a
 * restatement above it was only taking up height.
 */
@customElement("ui-date-field")
export class DateField extends LitElement {
  static formAssociated = true;
  static styles = dateFieldStyles;

  #internals: ElementInternals;
  #input?: HTMLInputElement;
  #localeObserver?: () => void;
  // The picker's selection while the popup is open — committed to `value` on
  // OK, thrown away on Cancel. Kept apart from `value` so a range mid-pick
  // never reaches the form or fires `change`.
  #draft = "";

  // Whether the <ui-date-picker> is currently rendered at all — see render().
  #popupOpen = false;

  @property()
  accessor name = "";

  @property()
  accessor label = "";

  /** The picker core's raw value string — see format.ts for the per-mode shapes. */
  @property()
  accessor value = "";

  @property({ attribute: "selection-mode" })
  accessor selectionMode: DateFieldSelectionMode = "date";

  /**
   * ISO `yyyy-mm-dd` bounds handed to the picker. Only meaningful for the
   * day-based modes; a `month`/`quarter`/`year` sheet compares whole periods
   * against these, and `time`/`timeRange` ignore them entirely.
   */
  @property()
  accessor min: string | undefined = undefined;

  @property()
  accessor max: string | undefined = undefined;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ type: Boolean, reflect: true })
  accessor readonly = false;

  /** Shown when nothing is selected. */
  @property()
  accessor placeholder = "";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  // ---- pass-throughs to the picker in the popup ----

  @property({ type: Boolean, attribute: "show-week-numbers" })
  accessor showWeekNumbers = false;

  @property({ attribute: "calendar-size" })
  accessor calendarSize: "default" | "minimal" | "maximal" = "default";

  @property({ type: Boolean, attribute: "accentuate-header" })
  accessor accentuateHeader = false;

  @property({ type: Boolean, attribute: "highlight-current" })
  accessor highlightCurrent = false;

  @property({ type: Boolean, attribute: "highlight-weekends" })
  accessor highlightWeekends = false;

  @property({ type: Boolean, attribute: "disable-weekends" })
  accessor disableWeekends = false;

  @property({ type: Boolean, attribute: "enable-century-view" })
  accessor enableCenturyView = false;

  /**
   * The increment, in minutes, between the picker's minute options — `15` for
   * quarter hours, `60` to pin minutes to the hour. Only affects the
   * time-bearing modes. See `ui-date-picker`'s own `minuteStep` for the exact
   * handling of out-of-range values and of a value that isn't on the grid.
   */
  @property({ type: Number, attribute: "minute-step" })
  accessor minuteStep = 1;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // The displayed text is Intl-formatted (see #displayValue), so a language
    // change has to re-render even though nothing about `value` moved.
    this.#localeObserver = observeLocale(this, () => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#localeObserver?.();
    this.#localeObserver = undefined;
  }

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input") ?? undefined;
    this.#draft = this.value;
    this.#syncFormValue();
    this.#syncValidity();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value") || changed.has("disabled")) {
      this.#syncFormValue();
    }

    if (
      changed.has("value") ||
      changed.has("required") ||
      changed.has("min") ||
      changed.has("max") ||
      changed.has("selectionMode")
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
    } else if (this.selectionMode === "date" && this.value) {
      // Only checked for the plain `date` mode: for every other mode `value`
      // isn't a yyyy-mm-dd day (it's a week, a quarter, a comma-joined
      // range, …), so comparing it against these bounds as a string would be
      // meaningless. The picker still enforces min/max on its own grid in all
      // modes — this is only the extra form-level report.
      if (this.min && this.value < this.min) {
        flags.rangeUnderflow = true;
        message = `Date must be on or after ${this.min}.`;
      } else if (this.max && this.value > this.max) {
        flags.rangeOverflow = true;
        message = `Date must be on or before ${this.max}.`;
      }
    }

    this.#internals.setValidity(flags, message, this.#input);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  /** The mode's own icon — see icons/icons.ts. */
  get #icon() {
    return FIELD_ICONS[this.selectionMode];
  }

  get #displayValue(): string {
    return formatFieldValue(this.value, this.selectionMode, closestLang(this));
  }

  get #popup(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>("#picker-popup");
  }

  #commit(next: string) {
    if (next === this.value) return;
    this.value = next;
    this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  async #openPopup() {
    if (this.disabled || this.readonly) return;
    // Start each session from the committed value, so a previous Cancel can't
    // leak its abandoned draft into the next one.
    this.#draft = this.value;
    this.#popupOpen = true;
    this.requestUpdate();
    // The picker is created by this update (render() below), so the popover
    // can only be shown once it has landed — otherwise the card would open
    // empty and grow a frame later.
    await this.updateComplete;
    this.#popup?.showPopover();
  }

  #closePopup() {
    this.#popup?.hidePopover();
    this.#input?.focus();
  }

  // The readonly display input is this component's focusable control (it is
  // also the popup's trigger — see render()), so host focus delegates there,
  // the same as every other field here. Needed as a real override rather than
  // inheriting HTMLElement.focus(): the host itself carries no tabindex, so
  // the inherited version would be a no-op — including for the <label for>
  // path wired up in the constructor.
  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  blur() {
    this.#input?.blur();
  }

  // Whether the popup was open when the pointer went down on a trigger — see
  // #onTriggerPointerDown.
  #wasOpenAtPointerDown = false;

  // A popover="auto" light-dismisses on *pointerup*, which is before the click
  // that follows it. So by the time #onTriggerClick runs, clicking the trigger
  // to close has already closed the popup — and a toggle that reads
  // `:popover-open` there sees `false` and dutifully re-opens what the user
  // just asked to dismiss. (Traced: pointerdown open=true, pointerup
  // open=false, click open=false. The intervening close doesn't even surface
  // as a `toggle` event: the reopen lands before the queued event dispatches,
  // and the two coalesce.)
  //
  // Sampling at pointerdown is the state the user was actually looking at when
  // they pressed.
  #onTriggerPointerDown = () => {
    this.#wasOpenAtPointerDown = this.#popup?.matches(":popover-open") ?? false;
  };

  // Dragging off the trigger means no click will arrive to consume the sample,
  // so drop it — otherwise it sits stale and eats the next *keyboard*
  // activation, which has no pointerdown of its own to refresh it.
  #onTriggerPointerLeave = () => {
    this.#wasOpenAtPointerDown = false;
  };

  // ui-button isn't a native button, so a declarative `popovertarget` on it
  // wouldn't do anything — the browser only honors that attribute on the form
  // elements it's defined for. Toggled by hand instead.
  #onTriggerClick = () => {
    // `:popover-open` still carries the keyboard case, where nothing was
    // light-dismissed and no pointerdown ever ran.
    const open = this.#wasOpenAtPointerDown || this.#popup?.matches(":popover-open");

    this.#wasOpenAtPointerDown = false;

    if (open) {
      this.#closePopup();
    } else {
      this.#openPopup();
    }
  };

  #onPickerChange = (event: Event) => {
    // Draft only — nothing reaches `value` (or the form, or a `change` event)
    // until OK. Re-rendered so the popup header tracks the selection.
    this.#draft = (event.currentTarget as DatePicker).value;
    this.requestUpdate();
  };

  #onOkClick = () => {
    this.#commit(this.#draft);
    this.#closePopup();
  };

  #onCancelClick = () => {
    this.#draft = this.value;
    this.requestUpdate();
    this.#closePopup();
  };

  #onClearClick = () => {
    this.#draft = "";
    this.#commit("");
    this.#closePopup();
  };

  // Every way the popup can close funnels through here — the footer buttons,
  // light-dismiss (click outside, Escape), and the trigger toggle — which is
  // why the teardown lives here rather than in #closePopup.
  //
  // Light-dismiss in particular bypasses the footer entirely, so it's treated
  // as Cancel: the abandoned draft is dropped instead of sitting there waiting
  // to be picked up by the next open.
  #onPopupToggle = (event: Event) => {
    if ((event as ToggleEvent).newState !== "closed") return;
    this.#draft = this.value;
    this.#popupOpen = false;
    this.requestUpdate();
  };

  render() {
    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <input
          id="input"
          type="text"
          readonly
          .value=${this.#displayValue}
          name=${this.name}
          placeholder=${this.placeholder}
          autocomplete="off"
          spellcheck="false"
          ?disabled=${this.disabled}
          ?required=${this.required}
          @pointerdown=${this.#onTriggerPointerDown}
          @pointerleave=${this.#onTriggerPointerLeave}
          @click=${this.#onTriggerClick}
        />
        <ui-button
          variant="link"
          size=${this.size}
          aria-label="Open picker"
          ?disabled=${this.disabled || this.readonly}
          @pointerdown=${this.#onTriggerPointerDown}
          @pointerleave=${this.#onTriggerPointerLeave}
          @click=${this.#onTriggerClick}
        >
          ${this.#icon}
        </ui-button>
      </div>
      <div
        id="picker-popup"
        class="picker-popup"
        popover="auto"
        @toggle=${this.#onPopupToggle}
      >
        <div class="popup-card">
          <!--
            Rendered only while the popup is open, so closing it destroys the
            picker and every scrap of state it holds: which view you drilled
            into (year/decade/century, the time sheets), which month is on
            screen, a half-picked range, the hovered cell, the time wheels'
            scroll positions. Each session therefore starts from the committed
            value and nothing else — reopening can't drop you back into the
            decade view you happened to leave behind.

            A reset method on the picker would have to enumerate that state and
            would go stale the moment the core grows more; not existing is the
            only version that can't miss a field. The element's own
            disconnectedCallback destroys the core (releasing the time columns'
            ResizeObserver), and building a fresh one is cheap — a month sheet
            costs ~0.2ms.
          -->
          ${this.#popupOpen
            ? html`
                <ui-date-picker
                  .value=${this.#draft}
                  selection-mode=${this.selectionMode}
                  calendar-size=${this.calendarSize}
                  ?show-week-numbers=${this.showWeekNumbers}
                  ?accentuate-header=${this.accentuateHeader}
                  ?highlight-current=${this.highlightCurrent}
                  ?highlight-weekends=${this.highlightWeekends}
                  ?disable-weekends=${this.disableWeekends}
                  ?enable-century-view=${this.enableCenturyView}
                  minute-step=${this.minuteStep}
                  .minDate=${parseIsoDay(this.min ?? "")}
                  .maxDate=${parseIsoDay(this.max ?? "")}
                  @change=${this.#onPickerChange}
                ></ui-date-picker>
              `
            : null}
          <div class="popup-footer">
            <ui-button variant="subtle" @click=${this.#onClearClick}>
              Clear
            </ui-button>
            <span class="popup-footer-spacer"></span>
            <ui-button variant="subtle" @click=${this.#onCancelClick}>
              Cancel
            </ui-button>
            <ui-button variant="subtle" @click=${this.#onOkClick}>
              OK
            </ui-button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-date-field": DateField;
  }
}
