import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { autocompleteStyles } from "./autocomplete.styles.js";
import { checkIcon } from "./icons/check.icon.js";
import { checkSquareIcon } from "./icons/check-square.icon.js";
import { chevronDownIcon } from "./icons/chevron.icon.js";
import { renderPills } from "../../shared/pills/pills.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";
import {
  injectAutocomplete,
  localFilter,
  type AutocompleteHandle,
  type AutocompleteRow,
  type AutocompleteItemGroup,
  type AutocompleteDataSource,
  type AutocompleteResult,
  type AutocompleteHeaderFooterText,
  type AutocompleteViewState,
} from "./autocomplete-core.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

export type {
  AutocompleteItemGroup,
  AutocompleteDataSource,
  AutocompleteResult,
};
export { localFilter };

/**
 * An autocomplete: a text input with a filtered dropdown, built on top of the
 * framework-agnostic `injectAutocomplete` core (see autocomplete-core.ts),
 * which owns everything about the feature that isn't rendering or fetching
 * data — querying/debouncing/keyboard navigation, popup visibility, the
 * loading-indicator delay, header/footer text, form association, and popup
 * placement/flip/max-height (measured rects, same approach as ui-select/
 * ui-combobox — see autocomplete-core.ts's header comment for why the
 * initial pure-CSS anchor-positioning attempt was abandoned). This component
 * only renders whatever the core reports via `onChange`, and forwards its
 * own lifecycle (post-render layout, form callbacks) and DOM refs (the real
 * `<input>`, the rendered popup/listbox/option elements) into it. Unlike
 * `ui-combobox` (which picks from `<ui-option>` children filtered
 * client-side), this component has no
 * children API at all — every option comes from `items` or an async
 * `dataSource`.
 *
 * Single-select (default) tracks the pick in `value` and mirrors it into the
 * input text, closing the popup on pick. `multiple` (like `<select
 * multiple>`) instead accumulates picks in `values`, toggling per option and
 * leaving the popup open and the input's text as free-form search; each
 * selected value renders as a removable pill at the start of the field. Form
 * submission then goes through a `FormData` with one entry per selected value
 * rather than a single string.
 *
 * Either pass a static `items` list — a flat string array, or an array of
 * `AutocompleteItemGroup` for a labeled separator per group (filtered
 * locally, see `localFilter`) — or a `dataSource` (e.g. to query a server);
 * `dataSource` takes precedence when set.
 */
@customElement("ui-autocomplete")
export class Autocomplete extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;
  #core?: AutocompleteHandle;

  @property({ type: Array })
  accessor items: string[] | AutocompleteItemGroup[] = [];

  @property({ attribute: false })
  accessor dataSource: AutocompleteDataSource | undefined = undefined;

  // Computes a line shown at the top/bottom of the popup — e.g. "Showing 20 of
  // 500" from `limitedTo`, or anything else derivable from the raw dataSource
  // result and the query that produced it. Only consulted while actual rows
  // are showing (see the core's showListbox) — there's nothing meaningful to
  // describe during "Loading…"/"No matches", so neither runs in those states.
  @property({ attribute: false })
  accessor headerText: AutocompleteHeaderFooterText | undefined = undefined;

  @property({ attribute: false })
  accessor footerText: AutocompleteHeaderFooterText | undefined = undefined;

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

  @property({ type: Boolean })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @state()
  accessor status: AutocompleteViewState["status"] = "idle";

  @state()
  accessor showLoadingIndicator = false;

  @state()
  accessor rows: AutocompleteRow[] = [];

  @state()
  accessor activeIndex = -1;

  @state()
  accessor open = false;

  @state()
  accessor query = "";

  @state()
  accessor showListbox = false;

  @state()
  accessor showLoadingStatus = false;

  @state()
  accessor showEmptyStatus = false;

  @state()
  accessor popupVisible = false;

  @state()
  accessor headerContent: string | undefined = undefined;

  @state()
  accessor footerContent: string | undefined = undefined;

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
      // true); flip the default here, not the constructor — see
      // ui-text-field's own connectedCallback for why (constructor
      // invariant violation when created from within another custom
      // element's reaction). Guarded so a later reconnect never clobbers a
      // consumer's own explicit override.
      this.spellcheck = false;
    }
  }

  static styles = autocompleteStyles;

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;

    this.#core = injectAutocomplete({
      host: this,
      internals: this.#internals,
      input: this.#input,
      getItems: () => this.items,
      getDataSource: () => this.dataSource,
      getMultiple: () => this.multiple,
      getDisabled: () => this.disabled,
      getName: () => this.name,
      getValue: () => this.value,
      getValues: () => this.values,
      getHeaderText: () => this.headerText,
      getFooterText: () => this.footerText,
      getPopupElement: () =>
        this.renderRoot.querySelector<HTMLElement>("#popup"),
      getListboxElement: () =>
        this.renderRoot.querySelector<HTMLElement>("#listbox"),
      getOptionElement: (selectableIndex) =>
        this.renderRoot.querySelector<HTMLElement>(
          `#option-${selectableIndex}`,
        ),
      onChange: (next) => {
        this.query = next.query;
        this.status = next.status;
        this.rows = next.rows;
        this.activeIndex = next.activeIndex;
        this.open = next.open;
        this.value = next.value;
        this.values = next.values;
        this.showLoadingIndicator = next.showLoadingIndicator;
        this.showListbox = next.showListbox;
        this.showLoadingStatus = next.showLoadingStatus;
        this.showEmptyStatus = next.showEmptyStatus;
        this.popupVisible = next.popupVisible;
        this.headerContent = next.headerContent;
        this.footerContent = next.footerContent;
      },
    });
  }

  protected updated(changed: PropertyValues<this>) {
    this.#core?.afterRender({
      activeIndex: changed.has("activeIndex"),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#core?.destroy();
  }

  #removePill(item: string, event: Event) {
    this.#core?.onRemovePill(item, event);
  }

  #onOptionPointerDown(index: number, event: Event) {
    this.#core?.onOptionPointerDown(index, event);
  }

  #onChevronClick() {
    this.#core?.onChevronClick();
  }

  formResetCallback() {
    this.#core?.formResetCallback();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.#core?.formStateRestoreCallback(state);
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
      this.#internals.setValidity({});
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  #isSelected(item: string): boolean {
    return this.multiple ? this.values.includes(item) : item === this.value;
  }

  render() {
    const activeId =
      this.activeIndex >= 0 ? `option-${this.activeIndex}` : undefined;

    // Preview the arrow-key-highlighted item in the input itself (single-select
    // only — in multi-select the input stays a free-form search box while picks
    // toggle checkmarks, so previewing one item's text there would fight typing).
    // Falls back to `value` — the last actual pick — whenever nothing is
    // highlighted (activeIndex is -1 both before any navigation and again once the
    // popup closes), which also happens to be the correctly resolved text on
    // Escape/blur without picking, since those reset activeIndex the same way.
    const activeRow = this.rows.find(
      (row): row is Extract<AutocompleteRow, { kind: "item" }> =>
        row.kind === "item" && row.selectableIndex === this.activeIndex,
    );
    const displayValue =
      !this.multiple && activeRow ? activeRow.item : this.value;

    return html`
      ${renderFieldLabel(this.label, "input")}
      <div class="wrapper">
        <div class="content">
          ${this.multiple
            ? renderPills(
                // Autocomplete's own picks are plain strings (no separate
                // value/label the way ui-select's <ui-option>-backed picks
                // have) — value and label are just the same string.
                this.values.map((item) => ({ value: item, label: item })),
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
            aria-activedescendant=${activeId ?? nothing}
            .value=${displayValue}
            name=${this.name}
            placeholder=${this.placeholder}
            autocomplete="off"
            spellcheck="false"
            ?disabled=${this.disabled}
            ?required=${this.required}
          />
        </div>
        <span
          class="chevron ${this.popupVisible ? "chevron-open" : ""}"
          @pointerdown=${(event: Event) => event.preventDefault()}
          @click=${() => this.#onChevronClick()}
          >${chevronDownIcon}</span
        >
        <div
          id="popup"
          class="popup"
          ?hidden=${!this.popupVisible}
          @pointerdown=${(event: Event) => event.preventDefault()}
        >
          ${this.headerContent
            ? html`<div class="header">${this.headerContent}</div>`
            : nothing}
          <ul
            id="listbox"
            role="listbox"
            class="listbox"
            aria-multiselectable=${this.multiple}
            ?hidden=${!this.showListbox}
          >
            ${this.rows.map((row) =>
              row.kind === "separator"
                ? html`<li role="presentation" class="separator">
                    ${row.label ?? nothing}
                  </li>`
                : html`<li
                    id="option-${row.selectableIndex}"
                    role="option"
                    class=${row.selectableIndex === this.activeIndex
                      ? "active"
                      : ""}
                    aria-selected=${this.#isSelected(row.item)}
                    @pointerdown=${(event: Event) =>
                      this.#onOptionPointerDown(row.selectableIndex, event)}
                  >
                    <span class="check"
                      >${this.#isSelected(row.item)
                        ? this.multiple
                          ? checkSquareIcon
                          : checkIcon
                        : nothing}</span
                    >
                    <span class="option-label">${row.item}</span>
                  </li>`,
            )}
          </ul>
          ${this.showLoadingStatus
            ? html`<div class="status">
                <span class="spinner"></span>Loading…
              </div>`
            : this.showEmptyStatus
              ? html`<div class="status">No matches</div>`
              : nothing}
          ${this.footerContent
            ? html`<div class="footer">${this.footerContent}</div>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-autocomplete": Autocomplete;
  }
}
