import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { radioButtonStyles } from "./radio-button.styles.js";

/**
 * A single radio choice, meant to live inside a `<ui-radio-group>` — wraps a
 * real `<input type="radio">` (visually hidden but focusable/keyboard-operable)
 * inside a `<label>`, same pattern as `ui-checkbox`. Not independently
 * form-associated: a lone native radio can't be *un*checked by the user once
 * checked, and more importantly, radios in separate shadow roots don't share a
 * native mutual-exclusion group even with the same `name` — both the checked
 * state and the exclusivity are owned by the parent `ui-radio-group` (see its
 * #pick/#syncChecked), which is also where form association actually lives.
 *
 * `tabbable` implements roving tabindex: the owning group keeps exactly one
 * radio in the normal Tab order (the checked one, or the first enabled one),
 * matching how a native radio group is only ever one Tab stop.
 */
@customElement("ui-radio-button")
export class RadioButton extends LitElement {
  #input!: HTMLInputElement;

  @property()
  accessor name = "";

  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor checked = false;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean, attribute: false })
  accessor tabbable = false;

  static styles = radioButtonStyles;

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;
    this.#input.tabIndex = this.tabbable ? 0 : -1;
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("tabbable") && this.#input) {
      this.#input.tabIndex = this.tabbable ? 0 : -1;
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  #onChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <label class="wrapper">
        <input
          type="radio"
          class="native"
          name=${this.name || nothing}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.#onChange}
        />
        <span class="box">
          <span class="dot"></span>
        </span>
        <span class="label"><slot></slot></span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-radio-button": RadioButton;
  }
}
