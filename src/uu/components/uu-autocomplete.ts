import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TemplateResult } from "lit";

import { FormControlElement } from "../base/form-control-element.js";
import type {
  FormControlConfig,
  FormControlRenderApi,
} from "../base/form-control-core.js";
import { autocompleteStyles } from "./uu-autocomplete.styles.js";
import { checkIcon, checkSquareIcon, chevronDownIcon } from "../icons/icons.js";
import { renderPills } from "../shared/pills.js";
import { buildMultiFormData } from "../shared/pill-values.js";
import {
  injectAutocomplete,
  localFilter,
  EMPTY_AUTOCOMPLETE_VIEW,
  type AutocompleteHandle,
  type AutocompleteRow,
  type AutocompleteItemGroup,
  type AutocompleteDataSource,
  type AutocompleteResult,
  type AutocompleteHeaderFooterText,
} from "../shared/autocomplete-core.js";

export type {
  AutocompleteItemGroup,
  AutocompleteDataSource,
  AutocompleteResult,
};
export { localFilter };

const handles = new WeakMap<Autocomplete, AutocompleteHandle>();

const config: FormControlConfig = {
  formValue: (host) => {
    const self = host as Autocomplete;
    if (self.multiple) return buildMultiFormData(self.name, self.values);
    return self.value || null;
  },
  computeValidity: (host) => {
    const self = host as Autocomplete;
    const empty = self.multiple ? self.values.length === 0 : !self.value;
    if (self.required && empty) {
      return {
        flags: { valueMissing: true },
        message: "Please select an option.",
      };
    }
    return { flags: {}, message: "" };
  },
  anchor: (host) =>
    (host as Autocomplete).renderRoot.querySelector<HTMLElement>("input"),
  reset: (host) => handles.get(host as Autocomplete)?.formResetCallback(),
  restore: (host, state) =>
    handles.get(host as Autocomplete)?.formStateRestoreCallback(state),
  render: (host, api) => renderAutocomplete(host as Autocomplete, api),
};

/**
 * A text input with a filtered dropdown, built on the framework-agnostic
 * `injectAutocomplete` core (querying / debouncing / keyboard nav / popup
 * visibility / loading-indicator delay / header-footer text / placement). This
 * component only renders the view snapshot the core exposes as `handle.view`.
 * Unlike `Combobox`, there's no children API — options come from `items` or an
 * async `dataSource` (`dataSource` wins when both are set).
 */
@customElement("uu-autocomplete")
export class Autocomplete extends FormControlElement {
  @property({ type: Array })
  accessor items: string[] | AutocompleteItemGroup[] = [];

  @property({ attribute: false })
  accessor dataSource: AutocompleteDataSource | undefined = undefined;

  @property({ attribute: false })
  accessor headerText: AutocompleteHeaderFooterText | undefined = undefined;

  @property({ attribute: false })
  accessor footerText: AutocompleteHeaderFooterText | undefined = undefined;

  @property()
  accessor value = "";

  @property({ type: Boolean })
  accessor multiple = false;

  @property({ type: Array })
  accessor values: string[] = [];

  @property({ type: Number, attribute: "max-options-visible" })
  accessor maxOptionsVisible: number | undefined = undefined;

  @property()
  accessor placeholder = "";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  static styles = autocompleteStyles;

  #prevActiveIndex = -1;

  constructor() {
    super(config);
  }

  protected firstUpdated() {
    const inputEl = this.renderRoot.querySelector<HTMLInputElement>("input")!;

    const handle = injectAutocomplete({
      host: this,
      input: inputEl,
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
      // The core keeps the public form value (`value` / `values`) in step; the
      // rest of the view is read straight off `handle.view` in `render`.
      onChange: (next) => {
        this.value = next.value;
        this.values = next.values;
        this.requestUpdate();
      },
    });
    handles.set(this, handle);

    super.firstUpdated();
  }

  protected updated() {
    super.updated();
    const handle = handles.get(this);
    const activeIndex = handle?.view.activeIndex ?? -1;
    handle?.afterRender({
      activeIndex: activeIndex !== this.#prevActiveIndex,
    });
    this.#prevActiveIndex = activeIndex;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    handles.get(this)?.destroy();
  }

  focus(options?: FocusOptions) {
    this.renderRoot.querySelector<HTMLInputElement>("input")?.focus(options);
  }
}

// --- rendering (module-scoped so `config.render` can reach it) ----------

function isSelected(host: Autocomplete, item: string): boolean {
  return host.multiple ? host.values.includes(item) : item === host.value;
}

function renderAutocomplete(
  host: Autocomplete,
  api: FormControlRenderApi,
): TemplateResult {
  const v = handles.get(host)?.view ?? EMPTY_AUTOCOMPLETE_VIEW;
  const activeId = v.activeIndex >= 0 ? `option-${v.activeIndex}` : undefined;

  // Preview the arrow-highlighted item in the input (single-select only);
  // fall back to `value` when nothing is highlighted.
  const activeRow = v.rows.find(
    (row): row is Extract<AutocompleteRow, { kind: "item" }> =>
      row.kind === "item" && row.selectableIndex === v.activeIndex,
  );
  const displayValue =
    !host.multiple && activeRow ? activeRow.item : host.value;

  return html`
    ${
      host.label
        ? html`<label class="label" for=${api.controlId}>${host.label}</label>`
        : nothing
    }
    <div class="wrapper">
      <div class="content">
        ${
          host.multiple
            ? renderPills(
                host.values.map((item) => ({ value: item, label: item })),
                (value, event) => handles.get(host)?.onRemovePill(value, event),
                host.maxOptionsVisible,
              )
            : nothing
        }
        <input
          id=${api.controlId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded=${v.open}
          aria-controls="listbox"
          aria-activedescendant=${activeId ?? nothing}
          aria-describedby=${api.describedBy ?? nothing}
          .value=${displayValue}
          name=${host.name}
          placeholder=${host.placeholder}
          autocomplete="off"
          spellcheck="false"
          ?disabled=${host.disabled}
          ?required=${host.required}
        />
      </div>
      <span
        class="chevron ${v.popupVisible ? "chevron-open" : ""}"
        @pointerdown=${(event: Event) => event.preventDefault()}
        @click=${() => handles.get(host)?.onChevronClick()}
        >${chevronDownIcon}</span
      >
      <div
        id="popup"
        class="popup"
        ?hidden=${!v.popupVisible}
        @pointerdown=${(event: Event) => event.preventDefault()}
      >
        ${
          v.headerContent
            ? html`<div class="header">${v.headerContent}</div>`
            : nothing
        }
        <ul
          id="listbox"
          role="listbox"
          class="listbox"
          aria-multiselectable=${host.multiple}
          ?hidden=${!v.showListbox}
        >
          ${v.rows.map((row) =>
            row.kind === "separator"
              ? html`<li role="presentation" class="separator">
                  ${row.label ?? nothing}
                </li>`
              : html`<li
                  id="option-${row.selectableIndex}"
                  role="option"
                  class=${row.selectableIndex === v.activeIndex ? "active" : ""}
                  aria-selected=${isSelected(host, row.item)}
                  @pointerdown=${(event: Event) =>
                    handles
                      .get(host)
                      ?.onOptionPointerDown(row.selectableIndex, event)}
                >
                  <span class="check"
                    >${
                      isSelected(host, row.item)
                        ? host.multiple
                          ? checkSquareIcon
                          : checkIcon
                        : nothing
                    }</span
                  >
                  <span class="option-label">${row.item}</span>
                </li>`,
          )}
        </ul>
        ${
          v.showLoadingStatus
            ? html`<div class="status">
                <span class="spinner"></span>Loading…
              </div>`
            : v.showEmptyStatus
              ? html`<div class="status">No matches</div>`
              : nothing
        }
        ${
          v.footerContent
            ? html`<div class="footer">${v.footerContent}</div>`
            : nothing
        }
      </div>
    </div>
    ${api.messages}
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-autocomplete": Autocomplete;
  }
}
