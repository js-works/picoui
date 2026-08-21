import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { tabStyles } from "./tab.styles.js";

/**
 * A single tab, meant to live inside a `<ui-tabs>` — its default slot is the
 * tab's own label (plain text, or an icon + text, same flexibility as
 * `ui-button`'s default slot), matched to its `<ui-tab-panel>` by sharing
 * the same `value`.
 *
 * The host itself *is* the tab — `role="tab"`, roving `tabIndex`, and
 * `aria-selected` all live directly on it (see below), rather than on some
 * element inside a shadow-DOM wrapper. That's what lets the owning
 * `ui-tabs` pair this with its panel via a plain `id`/`aria-controls`
 * reference (`#syncIds` in tabs.ts) — an ID set on something *inside* this
 * element's shadow root couldn't be referenced from `<ui-tab-panel>`'s own,
 * separate shadow root, but two light-DOM siblings (both children of the
 * same `<ui-tabs>`) referencing each other's `id` is just plain DOM, no
 * shadow boundary in the way.
 *
 * `selected`/`tabbable`/`orientation` are all set by the owning `ui-tabs`
 * only, never mutated locally — same convention as `ui-option`'s
 * `selected`/`active`, or `ui-radio-button`'s `tabbable`. This element
 * doesn't listen for its own clicks or Enter/Space either; `ui-tabs` owns
 * all of that centrally (see its own `#onKeydown`/click listener) the same
 * way `ui-radio-group` owns picking rather than each `ui-radio-button`.
 */
@customElement("ui-tab")
export class Tab extends LitElement {
  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  /** Set by the owning `ui-tabs` only — see the class doc comment. */
  @property({ type: Boolean, reflect: true })
  accessor selected = false;

  /** Set by the owning `ui-tabs` only — see the class doc comment. */
  @property({ type: Boolean, attribute: false })
  accessor tabbable = false;

  /**
   * Set by the owning `ui-tabs` only, mirroring its own `orientation` —
   * purely so this element's own stylesheet can react to it (`:host-context()`
   * would reach the same information, but isn't supported everywhere `:has()`
   * elsewhere in this library already assumes; a plain pushed-down property
   * sidesteps that entirely).
   */
  @property({ reflect: true })
  accessor orientation: "horizontal" | "vertical" = "horizontal";

  /**
   * Set by the owning `ui-tabs` only, mirroring its own (already-resolved)
   * `tabAlign`. Named `tabAlign`/`tab-align`, not `align` — see `ui-tabs`'s
   * own doc comment: `align` is a legacy HTML presentational attribute every
   * browser maps straight to `text-align`, which would otherwise leak into
   * this tab's own slotted label content.
   */
  @property({ reflect: true, attribute: "tab-align" })
  accessor tabAlign: "start" | "end" = "end";

  static styles = tabStyles;

  constructor() {
    super();
    this.setAttribute("role", "tab");
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("selected")) {
      this.setAttribute("aria-selected", String(this.selected));
    }
    if (changed.has("disabled")) {
      this.setAttribute("aria-disabled", String(this.disabled));
    }
    if (changed.has("tabbable") || changed.has("disabled")) {
      this.tabIndex = !this.disabled && this.tabbable ? 0 : -1;
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-tab": Tab;
  }
}
