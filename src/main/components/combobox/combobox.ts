import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { comboboxStyles } from "./combobox.styles.js";
import { chevronDownIcon } from "./icons/chevron.icon.js";
import "../select/option.js";
import "../select/option-group.js";
import type { Option } from "../select/option.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { renderPills } from "../../shared/pills/pills.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";
import {
  OptionListController,
  type OptionListItem,
} from "../../shared/option-list/option-list-core.js";

/**
 * Like `ui-select`, but editable: a text input filters the `<ui-option>` children
 * (optionally grouped under `<ui-option-group>`) client-side as you type, rather
 * than requiring a click to open a closed list. Unlike `ui-autocomplete`, there's
 * no `items`/`dataSource` — every option is a real slotted child, matched
 * synchronously by comparing its `.label` against the typed text (see
 * #applyFilter), the same way `ui-select` reads that DOM directly rather than
 * rendering plain data rows.
 *
 * The listbox engine — option enumeration, active-option tracking, open/close,
 * keyboard navigation, single-pick vs multi-toggle, form association — is the
 * shared `OptionListController` (shared/option-list/option-list-core.ts, also
 * used by `ui-select`). This component adds the text input on top: the
 * client-side filter, previewing the arrow-highlighted option in the input,
 * and `allow-custom-value`.
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
  #core!: OptionListController;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;

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
  accessor query = "";

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
    this.#core = new OptionListController(this, this.#internals, {
      onChange: () => this.requestUpdate(),
      listbox: () => this.renderRoot.querySelector<HTMLElement>("#listbox"),
      anchor: () => this.#input,
      focusControl: () => this.#input?.focus(),
      // Preview the keyboard-highlighted option's label in the input — single
      // mode only (in multi mode the input stays a free-form search box).
      onActiveKeyNav: (option) => {
        if (!this.multiple) this.#input.value = option.label;
      },
      onClose: () => this.#settleInput(),
      onAfterToggle: (option) => this.#afterToggle(option),
      onFormReset: () => {
        if (this.#input) this.#input.value = "";
      },
      onFormRestore: (state) => {
        if (this.#input) {
          this.#input.value = this.#core.selectedOption?.label ?? state;
        }
      },
    });
    this.#core.syncFormValue();
    this.#core.syncSelected();
    this.#core.syncValidity();
    if (!this.multiple) {
      this.#input.value = this.#core.selectedOption?.label ?? this.value;
    }
    this.#popupLayout = trackPopupLayout({
      getHostElement: () => this,
      getPopupElement: () => this.renderRoot.querySelector<HTMLElement>("#popup"),
    });
  }

  protected updated(changed: PropertyValues<this>) {
    this.#core.hostUpdated(changed);
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

  #onSlotChange() {
    this.#core?.syncSelected();
    this.#applyFilter(this.query);
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

  // On close (Escape/blur/chevron, or as part of a single pick): drop any
  // typed-but-not-picked filter text and reset the input to its resting state.
  #settleInput() {
    this.query = "";
    this.#applyFilter("");
    this.#input.value = this.multiple
      ? ""
      : (this.#core.selectedOption?.label ?? this.value);
  }

  // After a multi-select toggle: clear the search text/filter so the full list
  // is visible for the next pick, keeping the active option on the one just
  // toggled (still on-screen) rather than snapping back to the top.
  #afterToggle(option: OptionListItem) {
    this.#input.value = "";
    this.query = "";
    this.#applyFilter("");
    const options = this.#core.visibleOptions();
    const index = options.indexOf(option);
    this.#core.setActive(index === -1 ? options[0] : options[index]);
    this.#input.focus();
  }

  // The "creatable" escape hatch for allow-custom-value: commits whatever text
  // is currently typed as the value itself, bypassing the <ui-option> lookup
  // entirely since no option backs it. Callers only invoke this once they've
  // already checked allowCustomValue and that the query is non-empty.
  // `closeList` is false from Enter (multi mode keeps the popup open for the
  // next tag) but true from blur — focus has already left, so leaving the popup
  // open behind it would strand a dropdown nothing is driving.
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
        this.#core.closeList();
      } else {
        this.query = "";
        this.#applyFilter("");
        this.#core.setActive(this.#core.visibleOptions()[0]);
      }
    } else {
      const changed = this.value !== text;
      this.value = text;
      this.#input.value = text;
      this.#core.closeList();
      if (changed) {
        this.dispatchEvent(
          new Event("change", { bubbles: true, composed: true }),
        );
      }
    }
  }

  #removePill(value: string, event: Event) {
    event.preventDefault();
    this.#core.removeValue(value);
  }

  #onInput() {
    this.query = this.#input.value;
    this.#applyFilter(this.query);
    if (!this.#core.open) this.#core.setOpen(true);
    // Highlight the first match (or nothing) — not the current pick, unlike a
    // plain open — since the user is actively narrowing the list.
    this.#core.setActive(this.#core.visibleOptions()[0]);
  }

  #onInputFocus() {
    this.#core.openList();
  }

  #onInputClick() {
    this.#core.openList();
  }

  #onInputKeydown(event: KeyboardEvent) {
    if (this.#core.handleNavKey(event)) return;
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        if (this.#core.open) {
          if (this.#core.activeOption) this.#core.commitActive();
          else if (this.allowCustomValue && this.query.trim())
            this.#commitCustomValue();
        } else {
          this.#core.openList();
        }
        break;
      case "Tab":
        // No explicit close here — Tab also fires the native blur this input
        // is about to lose, and #onInputBlur already decides whether to
        // commit or revert; a direct close here would revert first and beat
        // it to the punch, so allow-custom-value could never commit on tab-out.
        break;
      default:
        break;
    }
  }

  #onInputBlur() {
    if (this.allowCustomValue && this.query.trim()) {
      this.#commitCustomValue({ closeList: true });
    } else {
      this.#core.closeList();
    }
  }

  // Same toggle affordance as ui-select's trigger chevron.
  #onChevronClick() {
    if (this.disabled) return;
    if (this.#core.open) {
      this.#core.closeList();
    } else {
      this.#input.focus();
      this.#core.openList();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  blur() {
    this.#input?.blur();
  }

  formResetCallback() {
    this.#core.formResetCallback();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.#core.formStateRestoreCallback(state);
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    this.#core.setCustomValidity(message);
  }

  render() {
    const optionEls = this.#options();
    const pills = this.multiple
      ? this.values.map((value) => ({
          value,
          label: optionEls.find((o) => o.value === value)?.label ?? value,
        }))
      : [];
    const open = this.#core?.open ?? false;
    const visibleCount = this.#core?.visibleOptions().length ?? 0;
    const showListbox = open && visibleCount > 0;
    const showNoMatches = open && !!this.query && visibleCount === 0;
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
            aria-expanded=${open}
            aria-controls="listbox"
            aria-activedescendant=${this.#core?.activeOption?.id ?? nothing}
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
          ><span class="chevron-icon ${open ? "chevron-open" : ""}"
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
            @click=${(event: Event) => this.#core.handleListboxClick(event)}
            @pointerdown=${(event: Event) => event.preventDefault()}
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
