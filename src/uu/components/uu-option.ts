import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { optionStyles } from "./uu-option.styles.js";
import { checkIcon } from "../icons/icons.js";

/**
 * A single choice inside `Select` (optionally grouped under `OptionGroup`) —
 * the custom-element analogue of a native `<option>`. `Select` only toggles
 * `selected` / `active` here and reads `.label` for its closed trigger text.
 */
@customElement("uu-option")
export class Option extends LitElement {
  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  // Set by the owning select to reflect the current value — not meant to be
  // set directly by a consumer.
  @property({ type: Boolean, reflect: true })
  accessor selected = false;

  // Keyboard/pointer-highlighted, independent of `selected` — also owned by
  // the parent select.
  @property({ type: Boolean, reflect: true })
  accessor active = false;

  // Mirrors the owner's `multiple` — turns the leading tick slot into an
  // always-visible checkbox square (styled in CSS) so a multi-select listbox
  // reads as one at a glance.
  @property({ type: Boolean, reflect: true })
  accessor multiple = false;

  static styles = optionStyles;

  // Plain-text label for the select's closed trigger.
  get label(): string {
    return this.textContent?.trim() ?? "";
  }

  connectedCallback() {
    super.connectedCallback();
    // `role` on the host (not an inner node) is what the owning list matches on
    // to enumerate its choices — tag-name agnostic, so the element can be
    // registered under any name.
    this.setAttribute("role", "option");
  }

  protected updated() {
    this.setAttribute("aria-selected", String(this.selected));
    this.setAttribute("aria-disabled", String(this.disabled));
  }

  render() {
    return html`
      <div class="option">
        <span class="check" aria-hidden="true">
          ${this.selected ? checkIcon : nothing}
        </span>
        <span class="label"><slot></slot></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-option": Option;
  }
}
