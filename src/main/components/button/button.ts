import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { buttonStyles } from "./button.styles.js";

/**
 * A button wrapping a real `<button>` — visual chrome only (color/variant/size);
 * activation, keyboard behavior (Enter/Space) and focus all come from the native
 * element for free. `type="submit"`/`"reset"` are handled by hand (see #onClick)
 * since a shadow-DOM-internal button has no ancestor `<form>` of its own to act on;
 * `this.closest("form")` walks the *light* DOM the host itself lives in instead.
 *
 * Label content is the default slot; `prefix`/`suffix` named slots take icons
 * either side of it (e.g. `<ui-button><svg slot="prefix">…</svg>Save</ui-button>`).
 * Icon-only buttons should set `aria-label` on the host — it's forwarded to the
 * internal button, since that's what actually receives focus.
 *
 * `name`/`value` are plain properties for a caller's own click handler to read
 * back (`(event.currentTarget as UiButton).value`, e.g. to tell which button in a
 * shared-handler group was pressed) — they aren't wired into the internal button,
 * since a shadow-DOM button submitting via `closest("form")` (see #onClick) never
 * becomes the form's actual submitter, so a real `name=value` pair wouldn't reach
 * the submitted FormData regardless.
 */
@customElement("ui-button")
export class Button extends LitElement {
  #button!: HTMLButtonElement;

  @property({ reflect: true })
  accessor tone: "neutral" | "primary" | "danger" | "warning" | "success" =
    "neutral";

  @property({ reflect: true })
  accessor variant: "solid" | "outlined" | "filled" | "subtle" | "link" =
    "solid";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property()
  accessor type: "button" | "submit" | "reset" = "button";

  @property()
  accessor name = "";

  @property()
  accessor value = "";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  // Disables the button and hides its content (prefix/label/suffix) behind an
  // overlaid spinner — hidden via visibility, not removed, so the button stays
  // exactly the size of its non-loading self (see .is-loading in the styles).
  // The caller flips this on while whatever the click kicked off is in flight,
  // rather than this component owning any async state of its own.
  @property({ type: Boolean, reflect: true })
  accessor loading = false;

  @property({ type: Boolean, reflect: true, attribute: "full-width" })
  accessor fullWidth = false;

  // Shadows Element's own ARIAMixin accessor of the same name so setting it (as
  // an attribute or a property) triggers a reactive re-render — needed to forward
  // it into the shadow root below, since the host itself is never what receives
  // focus.
  @property({ attribute: "aria-label" })
  accessor ariaLabel: string | null = null;

  // Same shadowing as ariaLabel above — for a disclosure-style button (e.g. a
  // datagrid row's expand/collapse toggle) whose expanded/collapsed state
  // needs to reach the real focusable element inside the shadow root.
  @property({ attribute: "aria-expanded" })
  accessor ariaExpanded: string | null = null;

  static styles = buttonStyles;

  protected firstUpdated() {
    this.#button = this.renderRoot.querySelector("button")!;
  }

  focus(options?: FocusOptions) {
    this.#button?.focus(options);
  }

  blur() {
    this.#button?.blur();
  }

  // The native button (never disabled while this fires — see the ?disabled
  // binding below) only needs help acting as a submit/reset button: it has no
  // ancestor <form> of its own inside the shadow root to act on.
  #onClick() {
    if (this.type === "submit") {
      this.closest("form")?.requestSubmit();
    } else if (this.type === "reset") {
      this.closest("form")?.reset();
    }
  }

  render() {
    return html`
      <button
        type="button"
        class="button${this.loading ? " is-loading" : ""}"
        aria-label=${this.ariaLabel ?? nothing}
        aria-expanded=${this.ariaExpanded ?? nothing}
        aria-busy=${this.loading ? "true" : nothing}
        ?disabled=${this.disabled || this.loading}
        @click=${this.#onClick}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        ${this.loading
          ? html`<span class="spinner" aria-hidden="true"></span>`
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-button": Button;
  }
}
