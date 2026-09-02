import { html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TemplateResult } from "lit";

import { FormControlElement } from "../base/form-control-element.js";
import type {
  FormControlConfig,
  FormControlRenderApi,
} from "../base/form-control-core.js";
import { selectStyles } from "./uu-select.styles.js";
import { chevronDownIcon } from "../icons/icons.js";
import { renderPills } from "../shared/pills.js";
import { trackPopupLayout } from "../shared/popup-layout.js";
import { OptionListController } from "../shared/option-list-core.js";
import type { Option } from "./uu-option.js";
import "./uu-option.js";
import "./uu-option-group.js";

// Per-instance engine, reachable from the module-scoped `config` closures
// (which only get the host) without putting anything on the element surface.
const controllers = new WeakMap<Select, OptionListController>();

const config: FormControlConfig = {
  formValue: (host) => controllers.get(host as Select)?.formValue() ?? null,
  computeValidity: (host) =>
    controllers.get(host as Select)?.computeValidity() ?? {
      flags: {},
      message: "",
    },
  anchor: (host) => {
    const self = host as Select;
    return self.renderRoot.querySelector<HTMLElement>(
      self.inline ? "#listbox" : ".trigger",
    );
  },
  reset: (host) => controllers.get(host as Select)?.reset(),
  restore: (host, state) => controllers.get(host as Select)?.restore(state),
  render: (host, api) => renderSelect(host as Select, api),
};

/**
 * A custom `<select>` replacement — pick one (or, with `multiple`, several)
 * values from `Option` children, optionally grouped under `OptionGroup`. The
 * shared `OptionListController` tracks selection and
 * active option; this component opens/closes/positions the popup.
 */
@customElement("uu-select")
export class Select extends FormControlElement {
  @property()
  accessor value = "";

  @property()
  accessor placeholder = "";

  @property({ type: Boolean })
  accessor multiple = false;

  @property({ type: Array })
  accessor values: string[] = [];

  // "pills" (default) — one removable tag per pick, capped by
  // `maxOptionsVisible` — or "text", a plain comma list.
  @property({ attribute: "multiple-value-display" })
  accessor multipleValueDisplay: "pills" | "text" = "pills";

  // Caps how many pills render; the rest collapse into one trailing "+N" pill.
  @property({ type: Number, attribute: "max-options-visible" })
  accessor maxOptionsVisible: number | undefined = undefined;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  // Promotes the popup into the browser's top layer via the Popover API — for
  // embedding somewhere its popup would otherwise be clipped or buried.
  @property({ type: Boolean, attribute: "popup-portal" })
  accessor popupPortal = false;

  // Always-expanded listbox instead of a closed trigger + popup — the analogue
  // of a native `<select size="N">`.
  @property({ type: Boolean, reflect: true })
  accessor inline = false;

  static styles = selectStyles;

  #trigger?: HTMLElement;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;

  constructor() {
    super(config);
  }

  protected firstUpdated() {
    this.#trigger =
      this.renderRoot.querySelector<HTMLElement>(
        this.inline ? "#listbox" : ".trigger",
      ) ?? undefined;

    const core = new OptionListController(this, {
      onChange: () => this.requestUpdate(),
      listbox: () => this.renderRoot.querySelector<HTMLElement>("#listbox"),
      focusControl: () => this.#trigger?.focus(),
    });
    controllers.set(this, core);
    core.syncSelected();

    // After the controller exists, so the base's mounted() sync resolves it.
    super.firstUpdated();

    if (this.inline) return;
    this.#popupLayout = trackPopupLayout({
      getHostElement: () =>
        this.renderRoot.querySelector<HTMLElement>(".wrapper"),
      getPopupElement: () =>
        this.renderRoot.querySelector<HTMLElement>("#popup"),
      usePopover: this.popupPortal,
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
    this.#trigger?.focus(options);
  }

  blur() {
    this.#trigger?.blur();
  }
}

// --- rendering (module-scoped so `config.render` can reach it) -----------

function onTriggerKeydown(host: Select, event: KeyboardEvent): void {
  const core = controllers.get(host);
  if (host.disabled || !core) return;
  if (core.handleNavKey(event)) return;
  switch (event.key) {
    case "Enter":
    case " ":
      event.preventDefault();
      if (core.open) core.commitActive();
      else core.openList();
      break;
    case "Tab":
      core.closeList();
      break;
    default:
      break;
  }
}

// The inline listbox has nothing to open/close — drive the nav primitives
// directly (handleNavKey's Home/End/Escape are gated on `open`).
function onInlineKeydown(host: Select, event: KeyboardEvent): void {
  const core = controllers.get(host);
  if (host.disabled || !core) return;
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      core.moveActive(1);
      break;
    case "ArrowUp":
      event.preventDefault();
      core.moveActive(-1);
      break;
    case "Home":
      event.preventDefault();
      core.setActiveToEdge("home");
      break;
    case "End":
      event.preventDefault();
      core.setActiveToEdge("end");
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      core.commitActive();
      break;
    default:
      break;
  }
}

function renderSelect(host: Select, api: FormControlRenderApi): TemplateResult {
  const core = controllers.get(host);
  const open = core?.open ?? false;
  const activeId = core?.activeOption?.id;

  const label = host.label
    ? html`<label
        class="label"
        for=${api.controlId}
        @click=${() => host.focus()}
        >${host.label}</label
      >`
    : nothing;

  if (host.inline) {
    return html`
      ${label}
      <div class="wrapper inline">
        <div
          id="listbox"
          role="listbox"
          class="listbox"
          tabindex=${host.disabled ? -1 : 0}
          aria-multiselectable=${host.multiple ? "true" : nothing}
          aria-activedescendant=${activeId ?? nothing}
          aria-describedby=${api.describedBy ?? nothing}
          aria-disabled=${host.disabled ? "true" : nothing}
          @click=${(event: Event) =>
            controllers.get(host)?.handleListboxClick(event)}
          @keydown=${(event: KeyboardEvent) => onInlineKeydown(host, event)}
          @focus=${() => {
            const c = controllers.get(host);
            if (c && !c.activeOption) c.activateForOpen();
          }}
        >
          <slot
            @slotchange=${() => controllers.get(host)?.syncSelected()}
          ></slot>
        </div>
      </div>
      ${api.messages}
    `;
  }

  const showPills = host.multiple && host.multipleValueDisplay === "pills";
  const showText = host.multiple && host.multipleValueDisplay === "text";

  const optionEls = [...host.querySelectorAll<Option>('[role="option"]')];
  const labelFor = (value: string) =>
    optionEls.find((option) => option.value === value)?.label ?? value;

  const pills = showPills
    ? host.values.map((value) => ({ value, label: labelFor(value) }))
    : [];
  const multipleText = showText ? host.values.map(labelFor).join(", ") : "";
  const singleLabel =
    optionEls.find((option) => option.value === host.value)?.label ?? "";
  const valueText = host.multiple
    ? showPills
      ? pills.length === 0
        ? host.placeholder
        : ""
      : multipleText || host.placeholder
    : singleLabel || host.placeholder;
  const isPlaceholder = host.multiple
    ? showPills
      ? pills.length === 0
      : !multipleText
    : !singleLabel;

  return html`
    ${label}
    <div class="wrapper">
      <div
        id=${api.controlId}
        class="trigger"
        role="combobox"
        tabindex=${host.disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded=${open}
        aria-controls="listbox"
        aria-activedescendant=${activeId ?? nothing}
        aria-describedby=${api.describedBy ?? nothing}
        aria-disabled=${host.disabled ? "true" : nothing}
        @click=${() => {
          const c = controllers.get(host);
          if (host.disabled || !c) return;
          if (c.open) c.closeList();
          else c.openList();
        }}
        @keydown=${(event: KeyboardEvent) => onTriggerKeydown(host, event)}
        @blur=${() => controllers.get(host)?.closeList()}
      >
        <div class="content">
          ${
            showPills
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
          ${
            valueText
              ? html`<span class="value ${isPlaceholder ? "placeholder" : ""}">
                  ${valueText}
                </span>`
              : nothing
          }
        </div>
        <span class="chevron">
          <span class="chevron-icon ${open ? "chevron-open" : ""}">
            ${chevronDownIcon}
          </span>
        </span>
      </div>
      <div
        id="popup"
        class="popup"
        ?hidden=${!open}
        popover=${host.popupPortal ? "manual" : nothing}
      >
        <div
          id="listbox"
          role="listbox"
          class="listbox"
          @click=${(event: Event) =>
            controllers.get(host)?.handleListboxClick(event)}
          @pointerdown=${(event: Event) => event.preventDefault()}
        >
          <slot
            @slotchange=${() => controllers.get(host)?.syncSelected()}
          ></slot>
        </div>
      </div>
    </div>
    ${api.messages}
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-select": Select;
  }
}
