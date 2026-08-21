import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { optionStyles } from "./option.styles.js";
import { checkIcon } from "./icons/check.icon.js";
import { checkSquareIcon } from "./icons/check-square.icon.js";

/**
 * A single choice inside `<ui-select>` (optionally grouped under
 * `<ui-option-group>`) — the custom-element analogue of a native `<option>`.
 * Renders its own row (checkmark + label) so it can be slotted as-is into the
 * select's open listbox; `ui-select` only toggles `selected`/`active` here and
 * reads `.label` for its closed trigger text, never re-rendering this option's
 * content anywhere else.
 */
@customElement("ui-option")
export class Option extends LitElement {
  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  // Set by the owning ui-select to reflect the current value — not meant to be
  // set directly by a consumer (there's no event/side effect wired to it here).
  @property({ type: Boolean, reflect: true })
  accessor selected = false;

  // Keyboard/pointer-highlighted, independent of `selected` — also owned by the
  // parent ui-select (see its #setActive).
  @property({ type: Boolean, reflect: true })
  accessor active = false;

  // Mirrors the owning ui-select/ui-combobox's own `multiple` — also set by
  // the owner (see its #syncSelected), never by a consumer directly. Swaps
  // the single-select checkmark for a checkbox-style checked-square glyph
  // when selected, so a multi-select listbox reads as one at a glance
  // instead of looking identical to a single-select. Unselected rows show
  // nothing in either mode — same as single-select's own checkmark-or-nothing.
  @property({ type: Boolean, reflect: true })
  accessor multiple = false;

  static styles = optionStyles;

  // Plain-text label for ui-select's closed trigger. An option's row can hold
  // richer content, but the trigger — like a native <select>'s closed box —
  // only ever shows text.
  get label(): string {
    return this.textContent?.trim() ?? "";
  }

  render() {
    return html`
      <div
        class="option"
        role="option"
        aria-selected=${this.selected}
        aria-disabled=${this.disabled}
      >
        <span class="check" aria-hidden="true">
          ${this.selected ? (this.multiple ? checkSquareIcon : checkIcon) : nothing}
        </span>
        <span class="label"><slot></slot></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-option": Option;
  }
}
