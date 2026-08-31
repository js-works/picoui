import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { selectStyles } from "./select.styles.js";
import { chevronDownIcon } from "./icons/chevron.icon.js";
import "./option.js";
import "./option-group.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";
import { renderPills } from "../../shared/pills/pills.js";
import { renderFieldLabel } from "../../shared/field-label/field-label.js";
import { OptionListController } from "../../shared/option-list/option-list-core.js";

/**
 * A custom `<select>` replacement — pick one value from `<ui-option>` children
 * (optionally grouped under `<ui-option-group>`), styled to match the rest of
 * this design system rather than the native `<select>` popup, which can't be
 * themed. The actual `<ui-option>` elements are slotted, unchanged, into the
 * open listbox; the shared `OptionListController` (see
 * shared/option-list/option-list-core.ts — also used by `ui-combobox`) tracks
 * which one is selected/active and owns form association, while this component
 * opens/closes/positions the popup using the shared popup-positioning tracker
 * (shared/popup-layout/popup-layout.ts).
 */
@customElement("ui-select")
export class Select extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #trigger!: HTMLElement;
  #core!: OptionListController;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;

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
    this.#core = new OptionListController(this, this.#internals, {
      onChange: () => this.requestUpdate(),
      listbox: () => this.renderRoot.querySelector<HTMLElement>("#listbox"),
      anchor: () => this.#trigger,
      focusControl: () => this.#trigger?.focus(),
    });
    this.#core.syncFormValue();
    this.#core.syncSelected();
    this.#core.syncValidity();
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

  #onSlotChange() {
    this.#core.syncSelected();
  }

  #onTriggerClick() {
    if (this.disabled) return;
    if (this.#core.open) this.#core.closeList();
    else this.#core.openList();
  }

  #onTriggerKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    if (this.#core.handleNavKey(event)) return;
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (this.#core.open) this.#core.commitActive();
        else this.#core.openList();
        break;
      case "Tab":
        this.#core.closeList();
        break;
      default:
        break;
    }
  }

  #onTriggerBlur() {
    this.#core.closeList();
  }

  // The always-visible inline listbox has nothing to open/close — ArrowDown/
  // Enter only move or pick an active option — so it drives the controller's
  // navigation primitives directly rather than going through handleNavKey
  // (whose Home/End/Escape are gated on `open`).
  #onInlineKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#core.moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#core.moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        this.#core.setActiveToEdge("home");
        break;
      case "End":
        event.preventDefault();
        this.#core.setActiveToEdge("end");
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        this.#core.commitActive();
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
    if (this.#core.activeOption) return;
    this.#core.activateForOpen();
  }

  focus(options?: FocusOptions) {
    this.#trigger?.focus(options);
  }

  blur() {
    this.#trigger?.blur();
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
            aria-activedescendant=${this.#core?.activeOption?.id ?? nothing}
            aria-disabled=${this.disabled ? "true" : nothing}
            @click=${(event: Event) => this.#core.handleListboxClick(event)}
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

    const optionEls = [...this.querySelectorAll("ui-option")] as {
      value: string;
      label: string;
    }[];
    const labelFor = (value: string) =>
      optionEls.find((option) => option.value === value)?.label ?? value;

    const pills = showPills
      ? this.values.map((value) => ({ value, label: labelFor(value) }))
      : [];
    const multipleText = showText ? this.values.map(labelFor).join(", ") : "";
    const singleLabel =
      optionEls.find((option) => option.value === this.value)?.label ?? "";
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
          aria-expanded=${this.#core?.open ?? false}
          aria-controls="listbox"
          aria-activedescendant=${this.#core?.activeOption?.id ?? nothing}
          aria-disabled=${this.disabled ? "true" : nothing}
          @click=${this.#onTriggerClick}
          @keydown=${this.#onTriggerKeydown}
          @blur=${this.#onTriggerBlur}
        >
          <div class="content">
            ${showPills
              ? renderPills(
                  pills,
                  (value, event) => {
                    event.preventDefault();
                    this.#core.removeValue(value);
                  },
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
            ><span
              class="chevron-icon ${this.#core?.open ? "chevron-open" : ""}"
              >${chevronDownIcon}</span
            ></span
          >
        </div>
        <div
          id="popup"
          class="popup"
          ?hidden=${!this.#core?.open}
          popover=${this.popupPortal ? "manual" : nothing}
        >
          <div
            id="listbox"
            role="listbox"
            class="listbox"
            @click=${(event: Event) => this.#core.handleListboxClick(event)}
            @pointerdown=${(event: Event) => event.preventDefault()}
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
