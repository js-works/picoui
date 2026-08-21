import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { headingStyles } from "./heading.styles.js";

/**
 * A section heading — `level` (1–6) is this component's one required
 * concept: it's what a real `<h1>`…`<h6>` would give you natively (document
 * outline, screen-reader "jump to heading" navigation), reproduced here via
 * `role="heading"` + `aria-level` on the host itself rather than a real
 * dynamic tag, since this is a custom element regardless of which native
 * heading level it stands in for.
 *
 * `level` alone already picks a sensible default size (its own dedicated
 * 6-step scale — see heading.styles.ts) — the same way a bare `<h3>` looks
 * different from a bare `<h1>` with no other styling. `size` is only for the
 * rarer case of wanting a *different* level's visual weight than what the
 * semantic `level` implies (e.g. an `<h2>` that should read as small as an
 * `<h4>`) — when set, it overrides the level-driven size with the same
 * `"small" | "medium" | "large"` scale every other sizable component here
 * uses.
 */
@customElement("ui-heading")
export class Heading extends LitElement {
  @property({ type: Number, reflect: true })
  accessor level: 1 | 2 | 3 | 4 | 5 | 6 = 2;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" | undefined = undefined;

  @property({ reflect: true })
  accessor tone: "neutral" | "primary" | "danger" | "warning" | "success" =
    "neutral";

  @property({ type: Boolean, reflect: true })
  accessor truncate = false;

  static styles = headingStyles;

  constructor() {
    super();
    this.setAttribute("role", "heading");
  }

  protected willUpdate(changed: PropertyValues<this>) {
    if (changed.has("level")) {
      this.setAttribute("aria-level", String(this.level));
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-heading": Heading;
  }
}
