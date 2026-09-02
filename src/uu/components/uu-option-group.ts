import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { optionGroupStyles } from "./uu-option-group.styles.js";

/**
 * Groups a run of `Option` children under a heading — the analogue of a
 * native `<optgroup label="…">`. Purely presentational: `Select` still finds
 * every option via a flat descendant query, which reaches into this group's
 * default slot regardless of nesting.
 */
@customElement("uu-option-group")
export class OptionGroup extends LitElement {
  @property()
  accessor label = "";

  static styles = optionGroupStyles;

  connectedCallback() {
    super.connectedCallback();
    // Host-level marker the owning list matches on — see `Option`.
    this.setAttribute("role", "group");
  }

  protected updated() {
    this.setAttribute("aria-label", this.label);
  }

  render() {
    return html`
      <div class="group">
        <div class="group-label" role="presentation">${this.label}</div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-option-group": OptionGroup;
  }
}
