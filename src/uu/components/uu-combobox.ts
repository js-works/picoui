import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TemplateResult } from "lit";

import { FormControlElement } from "../base/form-control-element.js";
import type {
  FormControlConfig,
  FormControlRenderApi,
} from "../base/form-control-core.js";
import { comboboxStyles } from "./uu-combobox.styles.js";
import { chevronDownIcon } from "../icons/icons.js";
import { renderPills } from "../shared/pills.js";
import { trackPopupLayout } from "../shared/popup-layout.js";
import {
  OptionListController,
  type OptionListItem,
} from "../shared/option-list-core.js";
import type { Option } from "./uu-option.js";
import "./uu-option.js";
import "./uu-option-group.js";

const controllers = new WeakMap<Combobox, OptionListController>();

// The typed filter text — what the user entered, which in single mode diverges
// from the input's displayed value while an option is arrow-previewed. Internal
// per-instance state, kept off the element surface.
const queries = new WeakMap<Combobox, string>();
const getQuery = (host: Combobox): string => queries.get(host) ?? "";
const setQuery = (host: Combobox, value: string): void => {
  queries.set(host, value);
  host.requestUpdate();
};

const config: FormControlConfig = {
  formValue: (host) => controllers.get(host as Combobox)?.formValue() ?? null,
  computeValidity: (host) =>
    controllers.get(host as Combobox)?.computeValidity() ?? {
      flags: {},
      message: "",
    },
  anchor: (host) =>
    (host as Combobox).renderRoot.querySelector<HTMLElement>("input"),
  reset: (host) => controllers.get(host as Combobox)?.reset(),
  restore: (host, state) => controllers.get(host as Combobox)?.restore(state),
  render: (host, api) => renderCombobox(host as Combobox, api),
};

/**
 * Like `Select`, but editable: a text input filters the `Option` children
 * client-side as you type. The listbox engine is the shared
 * `OptionListController`; this component adds the input, the filter, previewing
 * the arrow-highlighted option, and `allow-custom-value`.
 */
@customElement("uu-combobox")
export class Combobox extends FormControlElement {
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

  // "Creatable" escape hatch: commits typed text that matches no `Option`
  // as the value itself, instead of it being reverted once focus leaves.
  @property({ type: Boolean, attribute: "allow-custom-value" })
  accessor allowCustomValue = false;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  static styles = comboboxStyles;

  #popupLayout?: ReturnType<typeof trackPopupLayout>;

  constructor() {
    super(config);
  }

  protected firstUpdated() {
    const input = this.renderRoot.querySelector<HTMLInputElement>("input")!;

    const core = new OptionListController(this, {
      onChange: () => this.requestUpdate(),
      listbox: () => this.renderRoot.querySelector<HTMLElement>("#listbox"),
      focusControl: () => input.focus(),
      // Preview the keyboard-highlighted option's label in the input — single
      // mode only (in multi mode the input stays a free-form search box).
      onActiveKeyNav: (option) => {
        if (!this.multiple) input.value = option.label;
      },
      onClose: () => settleInput(this),
      onAfterToggle: (option) => afterToggle(this, option),
      onFormReset: () => {
        input.value = "";
      },
      onFormRestore: (stateValue) => {
        input.value =
          controllers.get(this)?.selectedOption?.label ?? stateValue;
      },
    });
    controllers.set(this, core);
    core.syncSelected();
    if (!this.multiple) {
      input.value = core.selectedOption?.label ?? this.value;
    }

    super.firstUpdated();

    this.#popupLayout = trackPopupLayout({
      getHostElement: () =>
        this.renderRoot.querySelector<HTMLElement>(".wrapper"),
      getPopupElement: () =>
        this.renderRoot.querySelector<HTMLElement>("#popup"),
    });
  }

  protected updated() {
    super.updated();
    controllers.get(this)?.syncSelected();
    this.#popupLayout?.update();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#popupLayout?.destroy();
  }

  focus(options?: FocusOptions) {
    this.renderRoot.querySelector<HTMLInputElement>("input")?.focus(options);
  }

  blur() {
    this.renderRoot.querySelector<HTMLInputElement>("input")?.blur();
  }
}

// --- interaction (module-scoped so `config.render` can reach it) --------

function input(host: Combobox): HTMLInputElement | null {
  return host.renderRoot.querySelector<HTMLInputElement>("input");
}

function options(host: Combobox): Option[] {
  return [...host.querySelectorAll<Option>('[role="option"]')];
}

// Case-insensitive substring match against each option's label; also hides a
// group left with no visible options.
function applyFilter(host: Combobox, query: string): void {
  const q = query.trim().toLowerCase();
  for (const option of options(host)) {
    option.hidden = q.length > 0 && !option.label.toLowerCase().includes(q);
  }
  for (const group of host.querySelectorAll<HTMLElement>('[role="group"]')) {
    const groupOptions = [...group.querySelectorAll<Option>('[role="option"]')];
    group.hidden =
      groupOptions.length > 0 && groupOptions.every((o) => o.hidden);
  }
}

// On close: drop any typed-but-not-picked filter text and reset the input.
function settleInput(host: Combobox): void {
  const core = controllers.get(host);
  setQuery(host, "");
  applyFilter(host, "");
  const el = input(host);
  if (el) {
    el.value = host.multiple ? "" : (core?.selectedOption?.label ?? host.value);
  }
}

// After a multi-select toggle: clear the search so the full list is visible,
// keeping the active option on the one just toggled.
function afterToggle(host: Combobox, option: OptionListItem): void {
  const core = controllers.get(host);
  const el = input(host);
  if (el) el.value = "";
  setQuery(host, "");
  applyFilter(host, "");
  if (!core) return;
  const visible = core.visibleOptions();
  const index = visible.indexOf(option);
  core.setActive(index === -1 ? visible[0] : visible[index]);
  el?.focus();
}

// The "creatable" escape hatch — commits the typed text as the value itself.
function commitCustomValue(
  host: Combobox,
  opts: { closeList?: boolean } = {},
): void {
  const core = controllers.get(host);
  const el = input(host);
  const text = getQuery(host).trim();
  if (!core) return;
  if (host.multiple) {
    if (!host.values.includes(text)) {
      host.values = [...host.values, text];
      host.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
    if (el) el.value = "";
    if (opts.closeList) {
      core.closeList();
    } else {
      setQuery(host, "");
      applyFilter(host, "");
      core.setActive(core.visibleOptions()[0]);
    }
  } else {
    const changed = host.value !== text;
    host.value = text;
    if (el) el.value = text;
    core.closeList();
    if (changed) {
      host.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
  }
}

function onComboInput(host: Combobox): void {
  const core = controllers.get(host);
  const el = input(host);
  if (!core || !el) return;
  setQuery(host, el.value);
  applyFilter(host, getQuery(host));
  if (!core.open) core.setOpen(true);
  // Highlight the first match — the user is actively narrowing.
  core.setActive(core.visibleOptions()[0]);
}

function onComboKeydown(host: Combobox, event: KeyboardEvent): void {
  const core = controllers.get(host);
  if (!core) return;
  if (core.handleNavKey(event)) return;
  switch (event.key) {
    case "Enter":
      event.preventDefault();
      if (core.open) {
        if (core.activeOption) core.commitActive();
        else if (host.allowCustomValue && getQuery(host).trim()) {
          commitCustomValue(host);
        }
      } else {
        core.openList();
      }
      break;
    // No explicit close on Tab — the native blur that follows drives the
    // commit-or-revert decision; closing here would revert first.
    case "Tab":
    default:
      break;
  }
}

function onComboBlur(host: Combobox): void {
  const core = controllers.get(host);
  if (!core) return;
  if (host.allowCustomValue && getQuery(host).trim()) {
    commitCustomValue(host, { closeList: true });
  } else {
    core.closeList();
  }
}

function onChevronClick(host: Combobox): void {
  const core = controllers.get(host);
  if (host.disabled || !core) return;
  if (core.open) {
    core.closeList();
  } else {
    input(host)?.focus();
    core.openList();
  }
}

function renderCombobox(
  host: Combobox,
  api: FormControlRenderApi,
): TemplateResult {
  const core = controllers.get(host);
  const optionEls = [...host.querySelectorAll<Option>('[role="option"]')];
  const pills = host.multiple
    ? host.values.map((value) => ({
        value,
        label: optionEls.find((o) => o.value === value)?.label ?? value,
      }))
    : [];
  const open = core?.open ?? false;
  const visibleCount = core?.visibleOptions().length ?? 0;
  const showListbox = open && visibleCount > 0;
  const showNoMatches = open && !!getQuery(host) && visibleCount === 0;
  const popupVisible = showListbox || showNoMatches;

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
                pills,
                (value, event) => {
                  event.preventDefault();
                  controllers.get(host)?.removeValue(value);
                },
                host.maxOptionsVisible,
              )
            : nothing
        }
        <input
          id=${api.controlId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded=${open}
          aria-controls="listbox"
          aria-activedescendant=${core?.activeOption?.id ?? nothing}
          aria-describedby=${api.describedBy ?? nothing}
          name=${host.name}
          placeholder=${host.placeholder}
          autocomplete="off"
          spellcheck="false"
          ?disabled=${host.disabled}
          ?required=${host.required}
          @input=${() => onComboInput(host)}
          @focus=${() => controllers.get(host)?.openList()}
          @click=${() => controllers.get(host)?.openList()}
          @keydown=${(event: KeyboardEvent) => onComboKeydown(host, event)}
          @blur=${() => onComboBlur(host)}
        />
      </div>
      <span
        class="chevron"
        @pointerdown=${(event: Event) => event.preventDefault()}
        @click=${() => onChevronClick(host)}
      >
        <span class="chevron-icon ${open ? "chevron-open" : ""}">
          ${chevronDownIcon}
        </span>
      </span>
      <div id="popup" class="popup" ?hidden=${!popupVisible}>
        <div
          id="listbox"
          role="listbox"
          class="listbox"
          aria-multiselectable=${host.multiple}
          ?hidden=${!showListbox}
          @click=${(event: Event) =>
            controllers.get(host)?.handleListboxClick(event)}
          @pointerdown=${(event: Event) => event.preventDefault()}
        >
          <slot
            @slotchange=${() => {
              controllers.get(host)?.syncSelected();
              applyFilter(host, getQuery(host));
            }}
          ></slot>
        </div>
        ${showNoMatches ? html`<div class="status">No matches</div>` : nothing}
      </div>
    </div>
    ${api.messages}
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-combobox": Combobox;
  }
}
