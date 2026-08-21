import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { tabsStyles } from "./tabs.styles.js";
import "./tab.js";
import type { Tab } from "./tab.js";
import "./tab-panel.js";
import type { TabPanel } from "./tab-panel.js";

// Shared by every ui-tabs instance on the page, so ids stay unique across
// them without needing a page-wide registry — same pattern ui-select uses
// for its own generated option ids.
const instanceId = Math.floor(Math.random() * 1e9);
let nextPairId = 0;

/**
 * Groups `<ui-tab>`/`<ui-tab-panel>` children (the tab and its matching
 * content live as two separate elements — see `ui-tab`'s own doc comment
 * for why — paired by sharing the same `value`) into a single-selection
 * tab interface, the custom-element analogue of a native tablist (there is
 * no built-in HTML control for this). Owns:
 *
 * - Which tab is selected and which panel is shown (`#syncSelected`) —
 *   `value` names the active pair; falls back to the first enabled tab
 *   whenever it doesn't match any current tab (`#syncAll`, covering both
 *   "never set" and "the previously active tab was just removed").
 * - The `id`/`aria-controls`/`aria-labelledby` pairing between each tab and
 *   its panel (`#syncIds`) — a lone `<ui-tab>`/`<ui-tab-panel>` has no way
 *   to find its own partner on its own.
 * - Roving tabindex (`#syncTabbable`) — exactly one tab is ever a Tab stop
 *   (the selected one, or the first enabled one), matching a native
 *   tablist.
 * - Arrow-key navigation (`#onKeydown`) — orientation-aware (only
 *   Left/Right for a horizontal tablist, only Up/Down for a vertical one,
 *   per the ARIA Authoring Practices tabs pattern), automatic-activation
 *   (arrow keys both move focus *and* select — same model `ui-radio-group`
 *   uses, distinct from a listbox's separate "highlighted" state that waits
 *   for a separate commit), plus Home/End to jump to the first/last enabled
 *   tab. Scoped to only fire while focus is actually on a tab, so a widget
 *   inside a panel's own content keeps its own arrow-key behavior.
 *
 * Tabs and panels render into two different areas of this element's own
 * layout (a tablist row/column, and a panel area) — `<ui-tab-panel>` needs
 * `slot="panel"` for that reason; `<ui-tab>` uses the default slot.
 */
@customElement("ui-tabs")
export class Tabs extends LitElement {
  @property()
  accessor value = "";

  @property({ reflect: true })
  accessor orientation: "horizontal" | "vertical" = "horizontal";

  /**
   * Which side the tablist hugs. The two orientations apply this at
   * different levels, since they have different spare space to work with:
   * vertical tabs already share one common width (`tabs.styles.ts` stretches
   * them), so this shifts each tab's own label within it (`tab.styles.ts`);
   * horizontal tabs are each sized to their own content, so there's no
   * per-tab space to shift a label into — instead this pushes the whole tab
   * row to one side of the tablist's own box (only visible if `<ui-tabs>`
   * itself is wider than its tabs need, e.g. an explicit width).
   *
   * Left unset (`null`), it defaults to whichever side already matched each
   * orientation's established look before this property existed — `"end"`
   * for vertical (hugging the divider, matching the selected accent border),
   * `"start"` for horizontal (the usual left-packed tab row) — rather than
   * one fixed literal default that would silently change one orientation's
   * appearance out from under existing callers.
   *
   * Named `tabAlign`/`tab-align`, not the shorter `align` — `align` is a
   * legacy HTML presentational attribute (`<div align="right">` et al.)
   * that every browser's UA stylesheet still maps straight to `text-align`
   * for *any* element carrying it, custom elements included. Reflecting our
   * own `align="end"` would silently apply `text-align: end` to this host
   * and, since text-align inherits, leak into the slotted panel content too.
   */
  @property({ reflect: true, attribute: "tab-align" })
  accessor tabAlign: "start" | "end" | null = null;

  constructor() {
    super();
    this.addEventListener("click", (event) => {
      const tab = (event.target as HTMLElement | null)?.closest?.(
        "ui-tab",
      ) as Tab | null;
      // Guard against a nested <ui-tabs> (e.g. one embedded in a panel's own
      // content): the click bubbles up to this element too, but the tab it
      // targets belongs to the inner instance, not this one.
      if (tab && tab.closest("ui-tabs") === this) this.#pick(tab);
    });
    this.addEventListener("keydown", (event) =>
      this.#onKeydown(event as KeyboardEvent),
    );
  }

  static styles = tabsStyles;

  protected firstUpdated() {
    this.#syncAll();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value")) {
      this.#syncSelected();
      this.#syncTabbable();
    }
    if (changed.has("orientation")) {
      this.#syncOrientation();
      this.#syncAlign();
    }
    if (changed.has("tabAlign")) {
      this.#syncAlign();
    }
  }

  // Resolves the per-orientation default described in `tabAlign`'s own doc
  // comment above.
  #effectiveAlign(): "start" | "end" {
    return (
      this.tabAlign ?? (this.orientation === "vertical" ? "end" : "start")
    );
  }

  // Scoped to tabs/panels actually owned by this instance — a plain
  // querySelectorAll would also pick up a nested <ui-tabs>'s own <ui-tab>s
  // (e.g. one embedded in a panel's own content), since they're still
  // light-DOM descendants of this element.
  #tabs(): Tab[] {
    return [...this.querySelectorAll<Tab>("ui-tab")].filter(
      (tab) => tab.closest("ui-tabs") === this,
    );
  }

  #panels(): TabPanel[] {
    return [...this.querySelectorAll<TabPanel>("ui-tab-panel")].filter(
      (panel) => panel.closest("ui-tabs") === this,
    );
  }

  #onSlotChange() {
    this.#syncAll();
  }

  #syncAll() {
    this.#syncIds();
    this.#syncOrientation();
    this.#syncAlign();

    const tabs = this.#tabs();
    if (!tabs.some((tab) => tab.value === this.value)) {
      this.value = tabs.find((tab) => !tab.disabled)?.value ?? "";
    }
    this.#syncSelected();
    this.#syncTabbable();
  }

  #syncIds() {
    for (const tab of this.#tabs()) {
      const panel = this.#panels().find((p) => p.value === tab.value);
      if (!panel) continue;
      if (!tab.id) tab.id = `ui-tab-${instanceId}-${++nextPairId}`;
      if (!panel.id) panel.id = `ui-tab-panel-${instanceId}-${nextPairId}`;
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
    }
  }

  #syncSelected() {
    for (const tab of this.#tabs()) {
      tab.selected = tab.value === this.value;
    }
    for (const panel of this.#panels()) {
      panel.active = panel.value === this.value;
    }
  }

  #syncTabbable() {
    const tabs = this.#tabs();
    const target =
      tabs.find((tab) => tab.selected) ?? tabs.find((tab) => !tab.disabled);
    for (const tab of tabs) {
      tab.tabbable = tab === target;
    }
  }

  #syncOrientation() {
    for (const tab of this.#tabs()) {
      tab.orientation = this.orientation;
    }
  }

  #syncAlign() {
    const align = this.#effectiveAlign();
    for (const tab of this.#tabs()) {
      tab.tabAlign = align;
    }
  }

  #pick(tab: Tab) {
    if (tab.disabled) return;
    const changed = this.value !== tab.value;
    this.value = tab.value;
    if (changed) {
      this.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
    }
  }

  // Only reacts while focus is on a tab itself — a widget inside a panel's
  // own (already-active) content keeps its own arrow-key/Home/End behavior
  // rather than this hijacking it.
  #onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const tab = target?.closest?.("ui-tab") as Tab | null;
    // Same nested-<ui-tabs> guard as the click listener above.
    if (!tab || tab.closest("ui-tabs") !== this) return;

    const horizontal = this.orientation === "horizontal";
    const forward = horizontal
      ? event.key === "ArrowRight"
      : event.key === "ArrowDown";
    const backward = horizontal
      ? event.key === "ArrowLeft"
      : event.key === "ArrowUp";
    const home = event.key === "Home";
    const end = event.key === "End";
    if (!forward && !backward && !home && !end) return;

    const tabs = this.#tabs().filter((tab) => !tab.disabled);
    if (tabs.length === 0) return;

    event.preventDefault();
    let next: Tab;
    if (home) {
      next = tabs[0];
    } else if (end) {
      next = tabs[tabs.length - 1];
    } else {
      const current = tabs.findIndex((tab) => tab.selected);
      const currentIndex = current === -1 ? 0 : current;
      const delta = forward ? 1 : -1;
      next = tabs[(currentIndex + delta + tabs.length) % tabs.length];
    }

    this.#pick(next);
    next.focus();
  }

  render() {
    return html`
      <div class="tablist" role="tablist" aria-orientation=${this.orientation}>
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
      <div class="panels">
        <slot name="panel" @slotchange=${this.#onSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-tabs": Tabs;
  }
}
