import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { menuButtonStyles } from "./menu-button.styles.js";
import { chevronDownIcon } from "./icons/chevron-down.icon.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { MenuController, MENU_TRANSITION_MS } from "../../shared/menu/menu-core.js";
import { menuEntryId, renderMenuPopup } from "../../shared/menu/menu-popup.js";
import { doubleRaf } from "../../shared/menu/double-raf.js";
import { trackMenuHeightTransition } from "../../shared/menu/menu-height-transition.js";
import type { MenuEntry, MenuSelectDetail } from "../../shared/menu/menu.types.js";

export type { MenuEntry, MenuAction, MenuSubmenu, MenuSeparator, MenuSelectDetail } from "../../shared/menu/menu.types.js";

/**
 * A button that opens a drill-down menu — `items` (see `MenuEntry`) renders
 * as one page at a time, sliding to a `MenuSubmenu`'s own `items` when
 * drilled into and back when backed out of, rather than the classic
 * cascading-flyout style (see menu-popup.ts/menu-core.ts for the actual
 * mechanics, shared with `ui-split-button`'s own menu half).
 *
 * The label is the default slot, exactly like `ui-button` (`appearance`/
 * `variant`/`size` reuse its same styles/tokens too — see
 * menu-button.styles.ts) — but this doesn't compose an actual `<ui-button>`
 * internally, since the ARIA a menu trigger needs (`aria-haspopup`,
 * `aria-expanded`, `aria-controls`, `aria-activedescendant`) has to land on
 * the real interactive `<button>`, and `ui-button` only forwards
 * `aria-label` onto its own internal one. Hand-rolling the same markup here
 * keeps that ARIA on the element that actually receives focus.
 *
 * Keyboard/virtual-focus model matches `ui-select`: focus never leaves this
 * button while the menu is open (`aria-activedescendant` tracks the
 * highlighted entry instead of real per-row focus), which is what lets
 * drilling in/back re-render an entirely different set of rows each time
 * without ever having to shift DOM focus between them.
 */
@customElement("ui-menu-button")
export class MenuButton extends LitElement {
  #namespace = `ui-menu-button-${Math.floor(Math.random() * 1e9)}`;
  #trigger!: HTMLButtonElement;
  #popupLayout?: ReturnType<typeof trackPopupLayout>;
  #menu: MenuController;
  // Animates the popup's box height smoothly across a page transition
  // (drilling in/backing out) instead of it snapping instantly to whatever
  // height the new page happens to need — see that module's own doc
  // comment for the prepare()/apply() split this drives from willUpdate()/
  // updated() below.
  #heightTransition = trackMenuHeightTransition({
    getViewportElement: () =>
      this.renderRoot.querySelector<HTMLElement>(".viewport"),
    durationMs: MENU_TRANSITION_MS,
  });

  @property({ type: Array })
  accessor items: MenuEntry[] = [];

  @property({ reflect: true })
  accessor appearance:
    | "neutral"
    | "primary"
    | "danger"
    | "warning"
    | "success" = "neutral";

  @property({ reflect: true })
  accessor variant: "solid" | "outlined" | "filled" | "subtle" | "link" =
    "solid";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  // Same escape hatch as ui-select's own popupPortal — see
  // shared/popup-layout/popup-layout.ts's `usePopover` option.
  @property({ type: Boolean, attribute: "popup-portal" })
  accessor popupPortal = false;

  constructor() {
    super();
    this.#menu = new MenuController({
      onChange: () => this.requestUpdate(),
      onSelect: (detail) => this.#dispatchSelect(detail),
    });
  }

  static styles = menuButtonStyles;

  protected firstUpdated() {
    this.#trigger = this.renderRoot.querySelector("button")!;
    this.#popupLayout = trackPopupLayout({
      // .wrapper, not `this` — see menu-button.styles.ts's own comment.
      getHostElement: () =>
        this.renderRoot.querySelector<HTMLElement>(".wrapper"),
      getPopupElement: () =>
        this.renderRoot.querySelector<HTMLElement>(`#${this.#namespace}-popup`),
      usePopover: this.popupPortal,
      // A menu's width is about its own labels, not its trigger's — see
      // popup-layout.ts's own doc comment on this option.
      matchWidth: false,
    });
  }

  // Captures the viewport's pre-update height while the outgoing page is
  // still the one in the DOM — see menu-height-transition.ts's own doc
  // comment for why this has to happen before Lit's patch, not after.
  protected willUpdate() {
    this.#heightTransition.prepare(this.#menu.transition);
  }

  protected updated() {
    // See double-raf.ts's own doc comment for why this needs two frames,
    // not one, to reliably animate rather than snap.
    if (this.#menu.transition?.phase === "start") {
      doubleRaf(() => this.#menu.runTransition());
    }
    this.#heightTransition.apply(this.#menu.transition);
    // Unconditional, not gated on the menu being open — mirrors
    // ui-select's own updated(), whose comment explains why: visibility can
    // flip without a narrower gate necessarily catching every transition.
    this.#popupLayout?.update();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#popupLayout?.destroy();
    this.#menu.destroy();
  }

  #dispatchSelect(detail: MenuSelectDetail) {
    this.dispatchEvent(
      new CustomEvent("menu-select", { detail, bubbles: true, composed: true }),
    );
  }

  #onTriggerClick() {
    if (this.disabled) return;
    this.#menu.toggleMenu(this.items);
  }

  #onTriggerKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    this.#menu.handleTriggerKeydown(this.items, event);
  }

  #onTriggerBlur() {
    this.#menu.closeMenu();
  }

  focus(options?: FocusOptions) {
    this.#trigger?.focus(options);
  }

  blur() {
    this.#trigger?.blur();
  }

  render() {
    const activeId =
      this.#menu.open && this.#menu.activeValue
        ? menuEntryId(this.#namespace, this.#menu.stack, this.#menu.activeValue)
        : nothing;

    return html`
      <div class="wrapper">
        <button
          type="button"
          class="button"
          ?disabled=${this.disabled}
          aria-haspopup="menu"
          aria-expanded=${this.#menu.open}
          aria-controls="${this.#namespace}-popup"
          aria-activedescendant=${activeId}
          @click=${this.#onTriggerClick}
          @keydown=${this.#onTriggerKeydown}
          @blur=${this.#onTriggerBlur}
        >
          <slot name="prefix"></slot>
          <slot></slot>
          <span class="chevron">${chevronDownIcon}</span>
        </button>
        ${renderMenuPopup({
          entries: this.items,
          controller: this.#menu,
          namespace: this.#namespace,
          popupPortal: this.popupPortal,
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-menu-button": MenuButton;
  }
}
