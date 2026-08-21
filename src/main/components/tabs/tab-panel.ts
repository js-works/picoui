import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { tabPanelStyles } from "./tab-panel.styles.js";

/**
 * One tab's content, meant to live inside a `<ui-tabs>` — matched to its
 * `<ui-tab>` by sharing the same `value`, the same way this pairs with
 * `slot="panel"` (`ui-tabs` renders tabs and panels into two separate areas,
 * so panels need a named slot; tabs use the default one). `active` is set
 * by the owning `ui-tabs` only (never mutated locally) — same convention as
 * `ui-option`'s `selected`/`active`: the owner decides, this just reflects
 * it into `[hidden]` and its own ARIA state.
 *
 * Always rendered, never added/removed from the DOM as tabs switch — so
 * whatever's inside (a form, a scroll position, a running animation) keeps
 * its state across switches rather than being torn down and rebuilt. A
 * consumer that wants lazy/one-shot rendering instead can still slot in
 * `nothing` for a panel it hasn't activated yet and swap in the real
 * content only once `active` (mirrored by this element's own `hidden`
 * property, so it's readable from outside) turns true.
 */
@customElement("ui-tab-panel")
export class TabPanel extends LitElement {
  @property()
  accessor value = "";

  /** Set by the owning `ui-tabs` only — see the class doc comment. */
  @property({ type: Boolean, reflect: true })
  accessor active = false;

  static styles = tabPanelStyles;

  constructor() {
    super();
    this.setAttribute("role", "tabpanel");
    // Reachable via Tab once its own tab activates it, per the ARIA
    // Authoring Practices tabs pattern — not otherwise in the Tab order,
    // since [hidden] (below) already removes it entirely while inactive.
    this.tabIndex = 0;
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("active")) {
      this.toggleAttribute("hidden", !this.active);
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-tab-panel": TabPanel;
  }
}
