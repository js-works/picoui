import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { optionGroupStyles } from "./option-group.styles.js";

/**
 * Groups a run of `<ui-option>` children under a heading — the custom-element
 * analogue of a native `<optgroup label="…">`. Purely presentational: ui-select
 * still finds every option via a flat `querySelectorAll("ui-option")` on
 * itself, which reaches into this group's default slot regardless of nesting.
 */
@customElement("ui-option-group")
export class OptionGroup extends LitElement {
  @property()
  accessor label = "";

  static styles = optionGroupStyles;

  render() {
    return html`
      <div class="group" role="group" aria-label=${this.label}>
        <div class="group-label" role="presentation">${this.label}</div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-option-group": OptionGroup;
  }
}
