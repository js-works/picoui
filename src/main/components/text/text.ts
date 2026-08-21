import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { textStyles } from "./text.styles.js";

/**
 * Body copy, captions, and helper/error text — the plain-text counterpart to
 * `ui-heading`. `as` controls block-vs-inline flow (and, for `"p"`,
 * paragraph spacing) rather than swapping the underlying element for a real
 * `<p>`/`<div>`/`<span>`: this is a custom element regardless of which of
 * those it stands in for, so there's nothing a real tag swap would add over
 * `display` alone (unlike `ui-heading`'s `level`, there's no equivalent
 * document-outline/screen-reader-navigation semantics `as` needs to
 * reproduce).
 *
 * `clamp` (a positive integer) ellipsizes after that many lines instead of
 * wrapping indefinitely, via `-webkit-line-clamp` — its actual value has to
 * reach the CSS as a real used value (an attribute selector alone can only
 * gate a rule on/off, not read the attribute's own value into one), so it's
 * set as an inline custom property on the host directly rather than in
 * text.styles.ts.
 */
@customElement("ui-text")
export class Text extends LitElement {
  @property({ reflect: true })
  accessor as: "span" | "p" | "div" = "span";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ reflect: true })
  accessor weight: "normal" | "semibold" | "bold" = "normal";

  @property({ reflect: true })
  accessor tone: "neutral" | "primary" | "danger" | "warning" | "success" =
    "neutral";

  @property({ type: Boolean, reflect: true })
  accessor muted = false;

  @property({ type: Boolean, reflect: true })
  accessor truncate = false;

  @property({ type: Number, reflect: true })
  accessor clamp: number | undefined = undefined;

  static styles = textStyles;

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("clamp")) {
      if (this.clamp) {
        this.style.setProperty("--text-clamp-lines", String(this.clamp));
      } else {
        this.style.removeProperty("--text-clamp-lines");
      }
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-text": Text;
  }
}
