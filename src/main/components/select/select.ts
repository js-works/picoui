import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { selectStyles } from "./select.styles.js";
import { chevronDownIcon } from "./icons/chevron.icon.js";
import "./option.js";
import "./option-group.js";
import type { Option } from "./option.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { scrollIntoListboxView } from "../../shared/scroll-into-listbox-view.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";
import {
  renderPills,
  togglePillValue,
  removePillValue,
  buildMultiFormData,
} from "../../shared/pills/pills.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";

// Mixed into every generated option id (see #setActive) alongside the
// incrementing counter below, so ids stay collision-safe against another
// copy of this same module bundled elsewhere on the page (each gets its own
// random instance number, rather than every copy's counter restarting at 1).
const instanceId = Math.floor(Math.random() * 1e9);
let nextOptionId = 0;

/**
 * A custom `<select>` replacement — pick one value from `<ui-option>` children
 * (optionally grouped under `<ui-option-group>`), styled to match the rest of
 * this design system rather than the native `<select>` popup, which can't be
 * themed. The actual `<ui-option>` elements are slotted, unchanged, into the
 * open listbox; this component only tracks which one is selected/active (see
 * #syncSelected/#setActive) and opens/closes/positions the popup, using the
 * shared popup-positioning tracker (see shared/popup-layout/popup-layout.ts)
 * also used by `ui-combobox` and `ui-autocomplete`.
 */
@customElement("ui-select")
export class Select extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #trigger!: HTMLElement;
  #activeOption?: Option;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;
  // Options we generated an id for (see #setActive) — a slotted <ui-option>
  // is the consumer's own element, so we only ever assign it an id (needed
  // for aria-activedescendant, which requires a real id reference — a
  // data-* attribute wouldn't satisfy that) when it doesn't already have
  // one, and only for as long as it's actually the active option; tracked
  // here so #setActive knows which ids are ours to remove again once an
  // option stops being active, rather than leaving generated ids permanently
  // stuck on every option a user has ever arrowed past.
  #generatedIdOptions = new WeakSet<Option>();

  @property()
  accessor name = "";

  // Renders as a real <label for="trigger"> above the field when set — its
  // own accessible name and click-to-focus, no ARIA wiring needed on our part.
  @property()
  accessor label = "";

  @property()
  accessor value = "";

  @property()
  accessor placeholder = "";

  @property({ type: Boolean })
  accessor multiple = false;

  @property({ type: Array })
  accessor values: string[] = [];

  // How `multiple` mode's picks render: "pills" (the default) — one removable
  // tag per pick, capped by maxOptionsVisible below — or "text", a single
  // plain "Option 1, Option 2" comma list (like the closed-trigger text of a
  // native `<select multiple>`, which has no per-pick chrome at all).
  @property({ attribute: "multiple-value-display" })
  accessor multipleValueDisplay: "pills" | "text" = "pills";

  // Caps how many pills `multiple` mode actually renders — the rest collapse
  // into one trailing "+N" pill (see shared/pills/pills.ts's renderPills)
  // instead of ballooning the trigger's width. Unset (the default) renders
  // every pick as its own pill, unlimited. Only applies when
  // multipleValueDisplay is "pills" — "text" has no per-pick chrome to cap.
  @property({ type: Number, attribute: "max-options-visible" })
  accessor maxOptionsVisible: number | undefined = undefined;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  // Escape hatch for embedding this component somewhere its popup would
  // otherwise get clipped or buried — a scrolling container with
  // `overflow: hidden`, or a stacking context the popup can't paint above
  // (e.g. inside a data grid's header row). Promotes the popup into the
  // browser's top layer via the Popover API instead of this component's
  // normal locally-positioned `position: absolute` popup — see
  // shared/popup-layout/popup-layout.ts's `usePopover` option for the full
  // story. Left off by default since it costs a bit of extra recomputation
  // (viewport-pixel repositioning on every scroll tick) most placements don't
  // need.
  @property({ type: Boolean, attribute: "popup-portal" })
  accessor popupPortal = false;

  // Renders as an always-expanded, always-visible listbox instead of the
  // default closed trigger + popup — the custom-element analogue of a native
  // `<select size="N">`/`<select multiple>` rather than a plain `<select>`.
  // No trigger button, no chevron, no popup layout tracking: the listbox
  // itself is the focusable host, real DOM focus lands there directly (there
  // being no separate trigger to hold virtual focus while a popup floats
  // over the page). Meant for embedding a plain pick-a-value list somewhere a
  // full combobox would be overkill (e.g. a time popup inside another field).
  @property({ type: Boolean, reflect: true })
  accessor inline = false;

  @state()
  accessor open = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does and
    // doesn't do for a form-associated custom element. Focus only, deliberately
    // not open: a label click says "put me in this control", and pressing
    // Enter/Space/ArrowDown — or clicking the trigger — is what says "show me
    // the options", same as a native <select>.
    focusOnLabelClick(this);
  }

  static styles = selectStyles;

  protected firstUpdated() {
    this.#trigger = this.renderRoot.querySelector<HTMLElement>(
      this.inline ? "#listbox" : ".trigger",
    )!;
    this.#syncFormValue();
    this.#syncSelected();
    this.#syncValidity();
    if (this.inline) return;
    this.#popupLayout = trackPopupLayout({
      // .wrapper, not `this` — :host can be stretched taller than the
      // trigger by a consumer's own layout (see .wrapper's comment in
      // select.styles.ts), which would then also throw off the
      // available-space math below/above the trigger, not just the popup's
      // visual anchor point.
      getHostElement: () =>
        this.renderRoot.querySelector<HTMLElement>(".wrapper"),
      getPopupElement: () => this.renderRoot.querySelector<HTMLElement>("#popup"),
      usePopover: this.popupPortal,
    });
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value") || changed.has("values")) {
      this.#syncFormValue();
      this.#syncSelected();
      this.#syncValidity();
    }
    // In multiple mode, #syncFormValue bakes `name` into the FormData it
    // builds (buildMultiFormData) — re-run it if `name` changes on its own
    // (e.g. set dynamically after mount), or the submitted field name would
    // stay stuck at whatever it was during the last value/values change.
    if (changed.has("name")) {
      this.#syncFormValue();
    }
    if (changed.has("required")) {
      this.#syncValidity();
    }
    // Called on every render pass, not gated on `open` — the popup's
    // visibility can flip without `open` itself changing on that particular
    // render (see autocomplete-core.ts's afterRender for why relying on a
    // narrower gate silently missed a real transition there).
    this.#popupLayout?.update();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#popupLayout?.destroy();
  }

  #options(): Option[] {
    return [...this.querySelectorAll<Option>("ui-option")];
  }

  get #selectedOption(): Option | undefined {
    return this.#options().find((option) => option.value === this.value);
  }

  #onSlotChange() {
    this.#syncSelected();
  }

  #syncFormValue() {
    if (this.disabled) {
      this.#internals.setFormValue(null);
      return;
    }
    if (this.multiple) {
      this.#internals.setFormValue(buildMultiFormData(this.name, this.values));
    } else {
      this.#internals.setFormValue(this.value || null);
    }
  }

  #syncValidity() {
    if (!this.#trigger) return;

    const flags: ValidityStateFlags = {};
    let message = "";
    const hasValue = this.multiple ? this.values.length > 0 : !!this.value;

    if (this.required && !hasValue) {
      flags.valueMissing = true;
      message = "Please select an option.";
    }

    this.#internals.setValidity(flags, message, this.#trigger);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  #syncSelected() {
    for (const option of this.#options()) {
      option.multiple = this.multiple;
      option.selected = this.multiple
        ? this.values.includes(option.value)
        : option.value === this.value;
    }
  }

  #setActive(option: Option | undefined) {
    if (this.#activeOption) {
      this.#activeOption.active = false;
      if (this.#generatedIdOptions.delete(this.#activeOption)) {
        this.#activeOption.removeAttribute("id");
      }
    }
    this.#activeOption = option;
    if (option) {
      if (!option.id) {
        option.id = `ui-option-${instanceId}-${++nextOptionId}`;
        this.#generatedIdOptions.add(option);
      }
      option.active = true;
      const listbox = this.renderRoot.querySelector<HTMLElement>("#listbox");
      if (listbox) scrollIntoListboxView(listbox, option);
    }
  }

  #openList() {
    if (this.open || this.disabled) return;
    this.open = true;
    const options = this.#options().filter((option) => !option.disabled);
    this.#setActive(this.#selectedOption ?? options[0]);
  }

  #closeList() {
    if (!this.open) return;
    this.open = false;
    this.#setActive(undefined);
  }

  #moveActive(delta: number) {
    const options = this.#options().filter((option) => !option.disabled);
    if (options.length === 0) return;

    const current = this.#activeOption
      ? options.indexOf(this.#activeOption)
      : -1;
    const next = Math.min(Math.max(current + delta, 0), options.length - 1);
    this.#setActive(options[next]);
  }

  #selectActive() {
    if (this.#activeOption) this.#pick(this.#activeOption);
  }

  #pick(option: Option) {
    if (this.multiple) {
      this.#toggle(option);
      return;
    }
    const changed = this.value !== option.value;
    this.value = option.value;
    this.#closeList();
    this.#trigger.focus();
    if (changed) {
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
  }

  // Toggles the pick and keeps the popup open — same shape as ui-combobox's
  // multi mode — rather than #pick's single-select close-on-pick.
  #toggle(option: Option) {
    this.values = togglePillValue(this.values, option.value);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  // Routed through #toggle (rather than the caller splicing `values`
  // directly) so the underlying <ui-option>.selected stays in sync — see
  // #syncSelected.
  #removePill(value: string, event: Event) {
    event.preventDefault();
    this.values = removePillValue(this.values, value);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  #onTriggerClick() {
    if (this.disabled) return;
    if (this.open) {
      this.#closeList();
    } else {
      this.#openList();
    }
  }

  #onTriggerKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (this.open) this.#moveActive(1);
        else this.#openList();
        break;
      case "ArrowUp":
        event.preventDefault();
        if (this.open) this.#moveActive(-1);
        else this.#openList();
        break;
      case "Home":
        if (this.open) {
          event.preventDefault();
          const options = this.#options().filter((option) => !option.disabled);
          this.#setActive(options[0]);
        }
        break;
      case "End":
        if (this.open) {
          event.preventDefault();
          const options = this.#options().filter((option) => !option.disabled);
          this.#setActive(options.at(-1));
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (this.open) this.#selectActive();
        else this.#openList();
        break;
      case "Escape":
        if (this.open) {
          event.preventDefault();
          this.#closeList();
        }
        break;
      case "Tab":
        this.#closeList();
        break;
      default:
        break;
    }
  }

  #onTriggerBlur() {
    this.#closeList();
  }

  // Same key set as #onTriggerKeydown's open-branch, minus the open/close
  // transitions themselves — the listbox is always visible in inline mode,
  // so there's nothing to open on ArrowDown/Enter, only an active option to
  // move or pick.
  #onInlineKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#moveActive(-1);
        break;
      case "Home": {
        event.preventDefault();
        const options = this.#options().filter((option) => !option.disabled);
        this.#setActive(options[0]);
        break;
      }
      case "End": {
        event.preventDefault();
        const options = this.#options().filter((option) => !option.disabled);
        this.#setActive(options.at(-1));
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        this.#selectActive();
        break;
      default:
        break;
    }
  }

  // Highlights a starting option the first time the listbox gains focus —
  // native <select size> has no equivalent (it starts with nothing
  // highlighted), but ui-option's active state is also what drives
  // aria-activedescendant, so leaving it unset until an arrow key would mean
  // an assistive-tech user gets no positional feedback at all until their
  // first keypress.
  #onInlineFocus() {
    if (this.#activeOption) return;
    const options = this.#options().filter((option) => !option.disabled);
    this.#setActive(this.#selectedOption ?? options[0]);
  }

  #onListboxClick(event: Event) {
    const option = (event.target as Element).closest(
      "ui-option",
    ) as Option | null;
    if (!option || option.disabled) return;
    this.#pick(option);
  }

  // Keeps focus on the trigger through a listbox click rather than letting it
  // blur (which would close the popup, via #onTriggerBlur, before the click
  // that picks from it lands) — same technique as ui-combobox's
  // onOptionPointerDown.
  #onListboxPointerDown(event: Event) {
    event.preventDefault();
  }

  focus(options?: FocusOptions) {
    this.#trigger?.focus(options);
  }

  blur() {
    this.#trigger?.blur();
  }

  formResetCallback() {
    this.value = "";
    this.values = [];
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (this.multiple) {
      if (state instanceof FormData) {
        this.values = state.getAll(this.name).map(String);
      }
      return;
    }
    if (typeof state === "string") {
      this.value = state;
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
      this.#internals.setValidity({ customError: true }, message, this.#trigger);
    } else {
      this.#syncValidity();
    }
  }

  render() {
    if (this.inline) {
      return html`
        ${renderFieldLabel(this.label, "listbox")}
        <div class="wrapper inline">
          <div
            id="listbox"
            role="listbox"
            class="listbox"
            tabindex=${this.disabled ? -1 : 0}
            aria-multiselectable=${this.multiple ? "true" : nothing}
            aria-activedescendant=${this.#activeOption?.id ?? nothing}
            aria-disabled=${this.disabled ? "true" : nothing}
            @click=${this.#onListboxClick}
            @keydown=${this.#onInlineKeydown}
            @focus=${this.#onInlineFocus}
          >
            <slot @slotchange=${this.#onSlotChange}></slot>
          </div>
        </div>
      `;
    }

    // In multiple mode, the picks show either as pills (own branch below) or,
    // with multipleValueDisplay: "text", as a plain comma list rendered
    // through this same .value span the single-select case already uses —
    // the placeholder still shows once nothing's picked, same as combobox's
    // <input placeholder> effect once its value is empty.
    const showPills = this.multiple && this.multipleValueDisplay === "pills";
    const showText = this.multiple && this.multipleValueDisplay === "text";

    const pills = showPills
      ? this.values.map((value) => ({
          value,
          label: this.#options().find((o) => o.value === value)?.label ?? value,
        }))
      : [];
    const multipleText = showText
      ? this.values
          .map(
            (value) =>
              this.#options().find((o) => o.value === value)?.label ?? value,
          )
          .join(", ")
      : "";
    const singleLabel = this.#selectedOption?.label ?? "";
    const valueText = this.multiple
      ? showPills
        ? pills.length === 0
          ? this.placeholder
          : ""
        : multipleText || this.placeholder
      : singleLabel || this.placeholder;
    const isPlaceholder = this.multiple
      ? showPills
        ? pills.length === 0
        : !multipleText
      : !singleLabel;

    return html`
      ${renderFieldLabel(this.label, "trigger")}
      <div class="wrapper">
        <div
          id="trigger"
          class="trigger"
          role="combobox"
          tabindex=${this.disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded=${this.open}
          aria-controls="listbox"
          aria-activedescendant=${this.#activeOption?.id ?? nothing}
          aria-disabled=${this.disabled ? "true" : nothing}
          @click=${this.#onTriggerClick}
          @keydown=${this.#onTriggerKeydown}
          @blur=${this.#onTriggerBlur}
        >
          <div class="content">
            ${showPills
              ? renderPills(
                  pills,
                  (value, event) => this.#removePill(value, event),
                  this.maxOptionsVisible,
                )
              : nothing}
            ${valueText
              ? html`<span class="value ${isPlaceholder ? "placeholder" : ""}">
                  ${valueText}
                </span>`
              : nothing}
          </div>
          <span class="chevron"
            ><span class="chevron-icon ${this.open ? "chevron-open" : ""}"
              >${chevronDownIcon}</span
            ></span
          >
        </div>
        <div
          id="popup"
          class="popup"
          ?hidden=${!this.open}
          popover=${this.popupPortal ? "manual" : nothing}
        >
          <div
            id="listbox"
            role="listbox"
            class="listbox"
            @click=${this.#onListboxClick}
            @pointerdown=${this.#onListboxPointerDown}
          >
            <slot @slotchange=${this.#onSlotChange}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-select": Select;
  }
}
