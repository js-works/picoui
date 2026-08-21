import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { comboboxStyles } from "./combobox.styles.js";
import { chevronDownIcon } from "./icons/chevron.icon.js";
import "../select/option.js";
import "../select/option-group.js";
import type { Option } from "../select/option.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { scrollIntoListboxView } from "../../shared/scroll-into-listbox-view.js";
import {
  renderPills,
  togglePillValue,
  removePillValue,
  buildMultiFormData,
} from "../../shared/pills/pills.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

// Mixed into every generated option id (see #setActiveIndex) alongside the
// incrementing counter below, so ids stay collision-safe against another
// copy of this same module bundled elsewhere on the page (each gets its own
// random instance number, rather than every copy's counter restarting at 1).
const instanceId = Math.floor(Math.random() * 1e9);
let nextOptionId = 0;

/**
 * Like `ui-select`, but editable: a text input filters the `<ui-option>` children
 * (optionally grouped under `<ui-option-group>`) client-side as you type, rather
 * than requiring a click to open a closed list. Unlike `ui-autocomplete`, there's
 * no `items`/`dataSource` — every option is a real slotted child, matched
 * synchronously by comparing its `.label` against the typed text (see
 * #applyFilter), the same way `ui-select` reads that DOM directly rather than
 * rendering plain data rows.
 *
 * Single-select (default) tracks the pick in `value` and mirrors it into the input
 * text, closing the popup on pick. `multiple` (like `<select multiple>`) instead
 * accumulates picks in `values`, toggling per option and leaving the popup open and
 * the input's text as a free-form filter that resets after each pick; each selected
 * value renders as a removable pill at the start of the field (same UI as
 * `ui-autocomplete`'s multi mode). Form submission then goes through a `FormData`
 * with one entry per selected value rather than a single string.
 *
 * `allow-custom-value` turns this into a "creatable" combobox: typed text that
 * matches no `<ui-option>` can still be committed as the value itself (Enter, or
 * losing focus) instead of always being reverted/discarded — see #commitCustomValue.
 */
@customElement("ui-combobox")
export class Combobox extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;
  // Options we generated an id for (see #setActiveIndex) — a slotted
  // <ui-option> is the consumer's own element, so we only ever assign it an
  // id (needed for aria-activedescendant, which requires a real id
  // reference — a data-* attribute wouldn't satisfy that) when it doesn't
  // already have one, and only for as long as it's actually the active
  // option; tracked here so #setActiveIndex knows which ids are ours to
  // remove again once an option stops being active, rather than leaving
  // generated ids permanently stuck on every option a user has ever arrowed
  // past.
  #generatedIdOptions = new WeakSet<Option>();

  @property()
  accessor name = "";

  // Renders as a real <label for="input"> above the field when set — its own
  // accessible name and click-to-focus, no ARIA wiring needed on our part.
  @property()
  accessor label = "";

  @property()
  accessor value = "";

  @property({ type: Boolean })
  accessor multiple = false;

  @property({ type: Array })
  accessor values: string[] = [];

  // Caps how many pills `multiple` mode actually renders — the rest collapse
  // into one trailing "+N" pill (see shared/pills/pills.ts's renderPills)
  // instead of ballooning the field's width. Unset (the default) renders
  // every pick as its own pill, unlimited.
  @property({ type: Number, attribute: "max-options-visible" })
  accessor maxOptionsVisible: number | undefined = undefined;

  @property()
  accessor placeholder = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  // "Creatable" escape hatch: commits typed text that matches no <ui-option>
  // as the value itself (see #commitCustomValue), instead of the typed text
  // always being discarded/reverted once the input loses focus without a pick.
  @property({ type: Boolean, attribute: "allow-custom-value" })
  accessor allowCustomValue = false;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @state()
  accessor open = false;

  @state()
  accessor query = "";

  @state()
  accessor activeIndex = -1;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  static styles = comboboxStyles;

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;
    this.#syncFormValue();
    this.#syncSelected();
    this.#syncValidity();
    if (!this.multiple) {
      this.#input.value = this.#selectedOption?.label ?? this.value;
    }
    this.#popupLayout = trackPopupLayout({
      getHostElement: () => this,
      getPopupElement: () => this.renderRoot.querySelector<HTMLElement>("#popup"),
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

  #visibleOptions(): Option[] {
    return this.#options().filter(
      (option) => !option.disabled && !option.hidden,
    );
  }

  get #selectedOption(): Option | undefined {
    return this.#options().find((option) => option.value === this.value);
  }

  get #activeOption(): Option | undefined {
    return this.#visibleOptions()[this.activeIndex];
  }

  #onSlotChange() {
    this.#syncSelected();
    this.#applyFilter(this.query);
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
    if (!this.#input) return;

    const flags: ValidityStateFlags = {};
    let message = "";
    const hasValue = this.multiple ? this.values.length > 0 : !!this.value;

    if (this.required && !hasValue) {
      flags.valueMissing = true;
      message = "Please select an option.";
    }

    this.#internals.setValidity(flags, message, this.#input);
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

  // Case-insensitive substring match against each option's plain-text label —
  // same semantics as ui-autocomplete's localFilter. Also hides any
  // <ui-option-group> left with no visible options, so filtering never leaves a
  // stray group heading floating above an empty section.
  #applyFilter(query: string) {
    const q = query.trim().toLowerCase();
    for (const option of this.#options()) {
      option.hidden = q.length > 0 && !option.label.toLowerCase().includes(q);
    }
    for (const group of this.querySelectorAll<HTMLElement>("ui-option-group")) {
      const options = [...group.querySelectorAll<Option>("ui-option")];
      group.hidden = options.length > 0 && options.every((o) => o.hidden);
    }
  }

  // `preview` mirrors the highlighted option's text into the input — only done
  // for explicit keyboard navigation (arrow/Home/End), never while the user is
  // typing/filtering (that would fight their own input), and never in multi mode
  // (the input there stays a free-form search box; picks show up as pills).
  #setActiveIndex(index: number, opts: { preview?: boolean } = {}) {
    const previousOption = this.#activeOption;
    for (const option of this.#options()) option.active = false;
    if (previousOption && this.#generatedIdOptions.delete(previousOption)) {
      previousOption.removeAttribute("id");
    }
    this.activeIndex = index;

    const option = this.#visibleOptions()[index];
    if (!option) return;

    if (!option.id) {
      option.id = `ui-combobox-option-${instanceId}-${++nextOptionId}`;
      this.#generatedIdOptions.add(option);
    }
    option.active = true;
    if (opts.preview && !this.multiple) {
      this.#input.value = option.label;
    }
    const listbox = this.renderRoot.querySelector<HTMLElement>("#listbox");
    if (listbox) scrollIntoListboxView(listbox, option);
  }

  #openList() {
    if (this.open || this.disabled) return;
    this.open = true;
    const options = this.#visibleOptions();
    const selectedIndex = this.multiple
      ? -1
      : options.findIndex((option) => option.value === this.value);
    this.#setActiveIndex(options.length === 0 ? -1 : Math.max(selectedIndex, 0));
  }

  // `revertText` discards any typed-but-not-picked filter text, restoring the
  // input to its resting state (the selected label, or blank in multi mode) —
  // skipped by #pick, which has already put the right text in place itself.
  #closeList(revertText = true) {
    if (!this.open) return;
    this.open = false;
    this.#setActiveIndex(-1);
    this.query = "";
    this.#applyFilter("");
    if (revertText) {
      this.#input.value = this.multiple
        ? ""
        : (this.#selectedOption?.label ?? this.value);
    }
  }

  #moveActive(delta: number) {
    const options = this.#visibleOptions();
    if (options.length === 0) return;
    const next = Math.min(Math.max(this.activeIndex + delta, 0), options.length - 1);
    this.#setActiveIndex(next, { preview: true });
  }

  #selectActive() {
    const option = this.#activeOption;
    if (!option) return;
    if (this.multiple) this.#toggle(option);
    else this.#pick(option);
  }

  #pick(option: Option) {
    const changed = this.value !== option.value;
    this.value = option.value;
    this.#input.value = option.label;
    this.#closeList(false);
    this.#input.focus();
    if (changed) {
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
  }

  // Toggles the pick, clears the search text/filter so the full list is visible
  // again for the next pick, and keeps the popup open — same shape as
  // ui-autocomplete's multi mode.
  #toggle(option: Option) {
    this.values = togglePillValue(this.values, option.value);
    this.#input.value = "";
    this.query = "";
    this.#applyFilter("");
    // Re-finds `option` itself in the now-unfiltered list, rather than always
    // snapping to index 0 — clearing the filter can reshuffle where things
    // land, so activeIndex still needs re-resolving against the new list,
    // but keeping it on the option just toggled (already on-screen, since
    // that's what was just clicked/activated) is what keeps
    // scrollIntoListboxView below a no-op instead of yanking the listbox's
    // scroll position back to wherever index 0 happens to be.
    const options = this.#visibleOptions();
    const index = options.indexOf(option);
    this.#setActiveIndex(index === -1 ? (options.length === 0 ? -1 : 0) : index);
    this.#input.focus();
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  // The "creatable" escape hatch for allow-custom-value: commits whatever text
  // is currently typed as the value itself, bypassing the <ui-option> lookup
  // entirely since no option backs it. Callers only invoke this once they've
  // already checked allowCustomValue and that the query is non-empty — mirrors
  // #pick/#toggle's own closing/reset shape, just without an Option to read.
  // `closeList` is false from Enter (multi mode keeps the popup open for the
  // next tag, same as #toggle) but true from blur — focus has already left,
  // so leaving the popup open behind it would strand a dropdown nothing is
  // driving.
  #commitCustomValue(opts: { closeList?: boolean } = {}) {
    const text = this.query.trim();
    if (this.multiple) {
      if (!this.values.includes(text)) {
        this.values = [...this.values, text];
        this.dispatchEvent(
          new Event("change", { bubbles: true, composed: true }),
        );
      }
      this.#input.value = "";
      if (opts.closeList) {
        this.#closeList(false);
      } else {
        this.query = "";
        this.#applyFilter("");
        const options = this.#visibleOptions();
        this.#setActiveIndex(options.length === 0 ? -1 : 0);
      }
    } else {
      const changed = this.value !== text;
      this.value = text;
      this.#input.value = text;
      this.#closeList(false);
      if (changed) {
        this.dispatchEvent(
          new Event("change", { bubbles: true, composed: true }),
        );
      }
    }
  }

  #removePill(value: string, event: Event) {
    event.preventDefault();
    this.values = removePillValue(this.values, value);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  #onInput() {
    this.query = this.#input.value;
    this.#applyFilter(this.query);
    if (!this.open) this.open = true;
    const options = this.#visibleOptions();
    this.#setActiveIndex(options.length === 0 ? -1 : 0);
  }

  #onInputFocus() {
    this.#openList();
  }

  #onInputClick() {
    this.#openList();
  }

  #onInputKeydown(event: KeyboardEvent) {
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
          this.#setActiveIndex(0, { preview: true });
        }
        break;
      case "End":
        if (this.open) {
          event.preventDefault();
          this.#setActiveIndex(this.#visibleOptions().length - 1, {
            preview: true,
          });
        }
        break;
      case "Enter":
        event.preventDefault();
        if (this.open) {
          if (this.#activeOption) this.#selectActive();
          else if (this.allowCustomValue && this.query.trim())
            this.#commitCustomValue();
        } else {
          this.#openList();
        }
        break;
      case "Escape":
        if (this.open) {
          event.preventDefault();
          this.#closeList();
        }
        break;
      case "Tab":
        // No explicit close here — Tab also fires the native blur this input
        // is about to lose, and #onInputBlur already decides whether to
        // commit or revert; a direct #closeList() here would revert first
        // and beat it to the punch, so allow-custom-value could never commit
        // on tab-out.
        break;
      default:
        break;
    }
  }

  #onInputBlur() {
    if (this.allowCustomValue && this.query.trim()) {
      this.#commitCustomValue({ closeList: true });
    } else {
      this.#closeList();
    }
  }

  #onListboxClick(event: Event) {
    const option = (event.target as Element).closest(
      "ui-option",
    ) as Option | null;
    if (!option || option.disabled || option.hidden) return;
    if (this.multiple) this.#toggle(option);
    else this.#pick(option);
  }

  // Keeps focus on the input through a listbox click rather than letting it blur
  // (which would close the popup, via #onInputBlur, before the click that picks
  // from it lands) — same technique as ui-select/ui-autocomplete use.
  #onListboxPointerDown(event: Event) {
    event.preventDefault();
  }

  // Same toggle affordance as ui-select's trigger chevron.
  #onChevronClick() {
    if (this.disabled) return;
    if (this.open) {
      this.#closeList();
    } else {
      this.#input.focus();
      this.#openList();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  blur() {
    this.#input?.blur();
  }

  formResetCallback() {
    this.value = "";
    this.values = [];
    if (this.#input) this.#input.value = "";
    this.#syncFormValue();
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
      if (this.#input) {
        this.#input.value = this.#selectedOption?.label ?? state;
      }
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

  render() {
    const pills = this.multiple
      ? this.values.map((value) => ({
          value,
          label: this.#options().find((o) => o.value === value)?.label ?? value,
        }))
      : [];
    const showListbox = this.open && this.#visibleOptions().length > 0;
    const showNoMatches =
      this.open && this.query && this.#visibleOptions().length === 0;
    const popupVisible = showListbox || showNoMatches;

    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <div class="content">
          ${this.multiple
            ? renderPills(
                pills,
                (value, event) => this.#removePill(value, event),
                this.maxOptionsVisible,
              )
            : nothing}
          <input
            id="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.open}
            aria-controls="listbox"
            aria-activedescendant=${this.#activeOption?.id ?? nothing}
            name=${this.name}
            placeholder=${this.placeholder}
            autocomplete="off"
            spellcheck="false"
            ?disabled=${this.disabled}
            ?required=${this.required}
            @input=${() => this.#onInput()}
            @focus=${() => this.#onInputFocus()}
            @click=${() => this.#onInputClick()}
            @keydown=${(event: KeyboardEvent) => this.#onInputKeydown(event)}
            @blur=${() => this.#onInputBlur()}
          />
        </div>
        <span
          class="chevron"
          @pointerdown=${(event: Event) => event.preventDefault()}
          @click=${() => this.#onChevronClick()}
          ><span class="chevron-icon ${this.open ? "chevron-open" : ""}"
            >${chevronDownIcon}</span
          ></span
        >
        <div id="popup" class="popup" ?hidden=${!popupVisible}>
          <div
            id="listbox"
            role="listbox"
            class="listbox"
            aria-multiselectable=${this.multiple}
            ?hidden=${!showListbox}
            @click=${(event: Event) => this.#onListboxClick(event)}
            @pointerdown=${(event: Event) => this.#onListboxPointerDown(event)}
          >
            <slot @slotchange=${() => this.#onSlotChange()}></slot>
          </div>
          ${showNoMatches
            ? html`<div class="status">No matches</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-combobox": Combobox;
  }
}
