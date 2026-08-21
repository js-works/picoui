import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { checkboxGroupStyles } from "./checkbox-group.styles.js";
import "./checkbox.js";
import type { Checkbox } from "./checkbox.js";
import {
  renderGroupLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";

/**
 * Aggregates a set of independent `<ui-checkbox>` children into one `values`
 * list and one `change` event — the custom-element analogue of a `<fieldset>`
 * wrapping related checkboxes. Unlike `ui-radio-group`, each `ui-checkbox` is
 * already independently form-associated and submits its own name/value (see
 * checkbox.ts), so this component deliberately never contributes a form value
 * of its own (`setFormValue(null)`, always) — it only participates in the
 * form for `required` *validity* (at least one child checked), the same way a
 * native `<fieldset>` can be invalid without itself being a submitted field.
 */
@customElement("ui-checkbox-group")
export class CheckboxGroup extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  // Restores each checkbox's own individually-set `disabled` when the group's
  // own `disabled` flips back off, rather than force-enabling every checkbox.
  #individualDisabled = new WeakMap<Checkbox, boolean>();

  @property()
  accessor name = "";

  // Renders as a plain caption above the group when set, wired to the group
  // via aria-labelledby (not a <label for>, since there's no single control
  // to point at — see shared/field-label/field-label.ts's renderGroupLabel).
  @property()
  accessor label = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ type: Array })
  accessor values: string[] = [];

  @property({ reflect: true })
  accessor orientation: "vertical" | "horizontal" = "vertical";

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.addEventListener("change", (event) => {
      // Ignore the group's own re-dispatched change (see #onChildChange) —
      // otherwise this listener would react to its own event and recurse.
      if (event.target === this) return;
      this.#onChildChange();
    });
  }

  static styles = [checkboxGroupStyles, fieldLabelStyles];

  protected firstUpdated() {
    this.#syncChecked();
    this.#syncName();
    this.#syncFormValue();
    this.#syncValidity();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("values")) {
      this.#syncChecked();
      this.#syncFormValue();
    }
    if (changed.has("disabled")) {
      this.#syncDisabled();
    }
    if (changed.has("name")) {
      this.#syncName();
    }
    if (changed.has("required") || changed.has("values")) {
      this.#syncValidity();
    }
  }

  #checkboxes(): Checkbox[] {
    return [...this.querySelectorAll<Checkbox>("ui-checkbox")];
  }

  #onSlotChange() {
    this.#syncChecked();
    this.#syncName();
  }

  // A checkbox toggled directly by the user is the source of truth — read the
  // set of checked boxes back into `values` rather than the other way around.
  #onChildChange() {
    this.values = this.#checkboxes()
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  #syncChecked() {
    for (const checkbox of this.#checkboxes()) {
      checkbox.checked = this.values.includes(checkbox.value);
    }
  }

  #syncName() {
    for (const checkbox of this.#checkboxes()) {
      checkbox.name = this.name;
    }
  }

  #syncDisabled() {
    for (const checkbox of this.#checkboxes()) {
      if (this.disabled) {
        if (!this.#individualDisabled.has(checkbox)) {
          this.#individualDisabled.set(checkbox, checkbox.disabled);
        }
        checkbox.disabled = true;
      } else if (this.#individualDisabled.has(checkbox)) {
        checkbox.disabled = this.#individualDisabled.get(checkbox)!;
        this.#individualDisabled.delete(checkbox);
      }
    }
  }

  // Never a form value of its own — see the class doc comment.
  #syncFormValue() {
    this.#internals.setFormValue(null);
  }

  #syncValidity() {
    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && this.values.length === 0) {
      flags.valueMissing = true;
      message = "Please select at least one option.";
    }

    this.#internals.setValidity(flags, message);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  formResetCallback() {
    this.values = [];
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
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
      ${renderGroupLabel(this.label, "group-label")}
      <div
        class="group"
        role="group"
        aria-labelledby=${this.label ? "group-label" : nothing}
      >
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-checkbox-group": CheckboxGroup;
  }
}
