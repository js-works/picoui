import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { createRef, ref } from "lit/directives/ref.js";
import type { ComplexAttributeConverter } from "lit";

import { datePickerStyles } from "./date-picker.styles.js";
import { DatePicker as Picker } from "./vanilla/date-picker.js";
import { GregorianCalendar } from "./vanilla/calendars/gregorian/gregorian-calendar.js";
import { closestDir, closestLang, observeLocale } from "../../shared/locale.js";

export type DatePickerSelectionMode = Picker.SelectionMode;

// Parses a `min-date`/`max-date` attribute into a Date. Anything unparseable
// becomes null (i.e. "no bound") rather than an Invalid Date, which the core
// would otherwise carry into its own min/max comparisons and silently
// disable every cell.
const dateAttributeConverter: ComplexAttributeConverter<Date | null> = {
  fromAttribute: (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  },
  toAttribute: (value) => (value ? value.toISOString().slice(0, 10) : null),
};

/**
 * A calendar date/time picker — month, year, decade and century views, with
 * single/multi/range selection and optional time sliders.
 *
 * The whole picker is a **framework-free core** (`./vanilla/`): its own tiny
 * virtual DOM (`vanilla/vdom.ts`), a `Calendar` interface with a Gregorian
 * implementation behind it, and a plain CSS string. This class is only the
 * Lit adapter — it owns the custom element, maps attributes onto the core's
 * props object, and bridges the core's `--cal-*` tokens onto this library's
 * theme (see date-picker.styles.ts). Nothing Lit-specific belongs in
 * `vanilla/`; keep that boundary intact.
 *
 * Because the core renders and patches its own DOM, Lit renders the host
 * container exactly once and then stands aside — see `shouldUpdate` below.
 *
 * Known gaps, deliberately left for a follow-up pass:
 * - Not form-associated. It reports its selection through `value` and a
 *   `change` event only; it does not participate in a `<form>` the way this
 *   library's field components do.
 * - `setValue` in the core is a `TODO` stub that splits on commas without
 *   validating, so setting `value` from outside is best-effort.
 */
@customElement("ui-date-picker")
export class DatePicker extends LitElement {
  static styles = datePickerStyles;

  @property()
  accessor value = "";

  @property({ attribute: "selection-mode" })
  accessor selectionMode: DatePickerSelectionMode = "date";

  @property({ type: Boolean, attribute: "accentuate-header" })
  accessor accentuateHeader = false;

  @property({ type: Boolean, attribute: "show-week-numbers" })
  accessor showWeekNumbers = false;

  @property({ attribute: "calendar-size" })
  accessor calendarSize: "default" | "minimal" | "maximal" = "minimal";

  @property({ type: Boolean, attribute: "highlight-current" })
  accessor highlightCurrent = false;

  @property({ type: Boolean, attribute: "highlight-weekends" })
  accessor highlightWeekends = false;

  @property({ type: Boolean, attribute: "disable-weekends" })
  accessor disableWeekends = false;

  @property({ type: Boolean, attribute: "enable-century-view" })
  accessor enableCenturyView = false;

  /**
   * The increment, in minutes, between the options the time view's minute
   * column offers: `15` for quarter hours, `60` to pin minutes to the hour.
   * Defaults to `1` — every minute.
   *
   * Only divisors of 60 give an even grid across the hour; a non-divisor is
   * accepted but leaves a shorter gap where it wraps. Anything outside 1–60
   * (including a value like `120`, which cannot mean "every two hours" — a
   * minute step has no way to filter the hour column) falls back to showing
   * `00` alone.
   *
   * A current value that isn't on the grid is kept and offered as an extra
   * option rather than being rounded.
   */
  @property({ type: Number, attribute: "minute-step" })
  accessor minuteStep = 1;

  @property({ converter: dateAttributeConverter, attribute: "min-date" })
  accessor minDate: Date | null = null;

  @property({ converter: dateAttributeConverter, attribute: "max-date" })
  accessor maxDate: Date | null = null;

  #picker: Picker;
  #containerRef = createRef<HTMLDivElement>();
  #localeObserver?: () => void;
  // What the core last reported, so an incoming `value` set from outside can
  // be told apart from the echo of the core's own change.
  #lastValue = "";

  constructor() {
    super();

    this.#picker = new Picker({
      calendar: new GregorianCalendar(() => closestLang(this)),
      getLocale: () => closestLang(this),
      getDirection: () => closestDir(this),
      getProps: () => this,
      requestUpdate: () => this.requestUpdate(),
      onChange: this.#onChange,
    });
  }

  #onChange = () => {
    this.#lastValue = this.#picker.getValue();
    this.value = this.#lastValue;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  connectedCallback() {
    super.connectedCallback();

    // The core reads `lang`/`dir` through the closures handed to it in the
    // constructor, and its month/weekday names, first day of week and text
    // direction all follow — but neither is a reactive property, so Lit won't
    // re-render on its own. Without this, retagging the language leaves an
    // already-mounted picker showing the old locale.
    this.#localeObserver = observeLocale(this, () => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#localeObserver?.();
    this.#localeObserver = undefined;
    // Releases the core's own DOM attachments (the time columns'
    // ResizeObserver); a later reconnect re-renders and re-attaches.
    this.#picker.destroy();
  }

  /** Returns the view to the month containing today. */
  resetView() {
    this.#picker.resetView();
  }

  // The core owns everything inside `.base` — it diffs and patches that
  // subtree itself through its own vdom — so after the first paint Lit must
  // not re-render the template (its `unsafeHTML` would blow the core's DOM
  // away and take the current view/selection with it). Returning false here
  // is what keeps Lit out; the imperative `render` above it is what actually
  // applies the update.
  //
  // Note this means `willUpdate`/`updated` never run on this element, which
  // is why the incoming-`value` sync lives here rather than in `updated`.
  // Inherited from the upstream version of this file, warts and all — it
  // works, but a cleaner seam is part of the follow-up.
  shouldUpdate() {
    if (!this.hasUpdated) {
      return true;
    }

    if (this.value !== this.#lastValue) {
      this.#lastValue = this.value;
      this.#picker.setValue(this.value);
    }

    this.#picker.render(this.#containerRef.value!);
    return false;
  }

  firstUpdated() {
    if (this.value) {
      this.#lastValue = this.value;
      this.#picker.setValue(this.value);
    }

    this.#picker.render(this.#containerRef.value!);
  }

  render() {
    // renderToString for the very first paint (so there's no empty frame),
    // then `firstUpdated` immediately hands the same subtree to the core's
    // real renderer, which adopts it and attaches the event listeners that
    // the string form can't carry.
    return html`
      <div class="base" ${ref(this.#containerRef)}>
        ${unsafeHTML(this.#picker.renderToString())}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-date-picker": DatePicker;
  }
}
