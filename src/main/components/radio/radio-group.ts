import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { radioGroupStyles } from "./radio-group.styles.js";
import "./radio-button.js";
import type { RadioButton } from "./radio-button.js";

/**
 * Groups `<ui-radio-button>` children into a single mutually-exclusive,
 * form-associated choice — the custom-element analogue of a set of native
 * `<input type="radio">`s sharing a `name`. That native sharing doesn't work
 * across separate shadow roots (see `ui-radio-button`'s own doc comment), so
 * this component owns what a browser would otherwise give for free: which
 * radio is checked (#syncChecked), arrow-key navigation that both moves focus
 * and picks (#onKeydown, matching native radio-group behavior — arrow keys
 * select immediately, unlike a listbox's separate "highlighted" state), roving
 * tabindex (#syncTabbable), and the actual `name`/`value` form submission.
 */
@customElement("ui-radio-group")
export class RadioGroup extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  // Restores each radio's own individually-set `disabled` when the group's own
  // `disabled` flips back off, rather than force-enabling every radio.
  #individualDisabled = new WeakMap<RadioButton, boolean>();

  @property()
  accessor name = "";

  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ reflect: true })
  accessor orientation: "vertical" | "horizontal" = "vertical";

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.addEventListener("change", (event) => {
      // Ignore the group's own re-dispatched change (see #pick) — otherwise
      // this listener would react to its own event and recurse.
      if (event.target === this) return;
      this.#pick(event.target as RadioButton);
    });
    this.addEventListener("keydown", (event) =>
      this.#onKeydown(event as KeyboardEvent),
    );
  }

  static styles = radioGroupStyles;

  protected firstUpdated() {
    this.#syncChecked();
    this.#syncTabbable();
    this.#syncName();
    this.#syncFormValue();
    this.#syncValidity();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value")) {
      this.#syncChecked();
      this.#syncTabbable();
      this.#syncFormValue();
    }
    if (changed.has("disabled")) {
      this.#syncDisabled();
    }
    if (changed.has("name")) {
      this.#syncName();
    }
    if (changed.has("required") || changed.has("value")) {
      this.#syncValidity();
    }
  }

  #radios(): RadioButton[] {
    return [...this.querySelectorAll<RadioButton>("ui-radio-button")];
  }

  #onSlotChange() {
    this.#syncChecked();
    this.#syncTabbable();
    this.#syncName();
  }

  #syncChecked() {
    for (const radio of this.#radios()) {
      radio.checked = radio.value === this.value;
    }
  }

  // Only one radio is ever a Tab stop — the checked one, or the first enabled
  // one if nothing's checked yet — matching a native radio group.
  #syncTabbable() {
    const radios = this.#radios();
    const target =
      radios.find((radio) => radio.checked) ??
      radios.find((radio) => !radio.disabled);
    for (const radio of radios) {
      radio.tabbable = radio === target;
    }
  }

  #syncName() {
    for (const radio of this.#radios()) {
      radio.name = this.name;
    }
  }

  #syncDisabled() {
    for (const radio of this.#radios()) {
      if (this.disabled) {
        if (!this.#individualDisabled.has(radio)) {
          this.#individualDisabled.set(radio, radio.disabled);
        }
        radio.disabled = true;
      } else if (this.#individualDisabled.has(radio)) {
        radio.disabled = this.#individualDisabled.get(radio)!;
        this.#individualDisabled.delete(radio);
      }
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value || null);
  }

  #syncValidity() {
    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && !this.value) {
      flags.valueMissing = true;
      message = "Please select an option.";
    }

    this.#internals.setValidity(flags, message);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  #pick(radio: RadioButton) {
    if (radio.disabled) return;
    const changed = this.value !== radio.value;
    this.value = radio.value;
    if (changed) {
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
  }

  // Arrow keys both move focus and pick — matching native radio-group
  // behavior (distinct from a listbox, where arrows only move a separate
  // "highlighted" state until Enter commits it).
  #onKeydown(event: KeyboardEvent) {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const backward = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !backward) return;

    const radios = this.#radios().filter((radio) => !radio.disabled);
    if (radios.length === 0) return;

    event.preventDefault();
    const current = radios.findIndex((radio) => radio.checked);
    const currentIndex = current === -1 ? 0 : current;
    const delta = forward ? 1 : -1;
    const next = radios[(currentIndex + delta + radios.length) % radios.length];

    this.#pick(next);
    next.focus();
  }

  formResetCallback() {
    this.value = "";
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
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
      this.#internals.setValidity({ customError: true }, message);
    } else {
      this.#syncValidity();
    }
  }

  render() {
    return html`
      <div class="group" role="radiogroup">
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-radio-group": RadioGroup;
  }
}
