import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { linkStyles } from "./link.styles.js";

/**
 * A themed anchor wrapping a real `<a>` — same reasoning as `ui-button`
 * wrapping a real `<button>`: focus, keyboard activation, and (here)
 * middle-click/ctrl-click-to-open-in-new-tab all come from the native
 * element for free, this only supplies the visual chrome. That chrome is
 * deliberately identical to `ui-button`'s own `variant="link"` (colored,
 * semibold, no underline/padding) — see link.styles.ts — reproduced here
 * rather than shared, since this isn't a `<ui-button>` under the hood.
 *
 * `tone` defaults to `"primary"`, unlike `ui-heading`/`ui-text` (which
 * default to `"neutral"`) — a bare link is expected to already read as a
 * link (colored) with no attributes set, the same way a plain `<a href>`
 * does; with no underline to fall back on, color is the one cue that it's
 * clickable at all.
 *
 * `target="_blank"` gets `rel="noopener noreferrer"` added automatically
 * (the tab it opens would otherwise get a live `window.opener` back to this
 * page) unless the caller sets `rel` explicitly.
 */
@customElement("ui-link")
export class Link extends LitElement {
  @property()
  accessor href = "";

  @property()
  accessor target = "";

  @property()
  accessor rel: string | undefined = undefined;

  @property({ reflect: true })
  accessor tone: "neutral" | "primary" | "danger" | "warning" | "success" =
    "primary";

  static styles = linkStyles;

  render() {
    const rel =
      this.rel ?? (this.target === "_blank" ? "noopener noreferrer" : nothing);

    return html`
      <a
        class="link"
        href=${this.href}
        target=${this.target || nothing}
        rel=${rel}
      >
        <slot></slot>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-link": Link;
  }
}
