import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { splitButtonStyles } from "./split-button.styles.js";
import { chevronDownIcon } from "./icons/chevron-down.icon.js";
import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { MenuController, MENU_TRANSITION_MS } from "../../shared/menu/menu-core.js";
import { menuEntryId, renderMenuPopup } from "../../shared/menu/menu-popup.js";
import { doubleRaf } from "../../shared/menu/double-raf.js";
import { trackMenuHeightTransition } from "../../shared/menu/menu-height-transition.js";
import type { MenuEntry, MenuSelectDetail } from "../../shared/menu/menu.types.js";

export type { MenuEntry, MenuAction, MenuSubmenu, MenuSeparator, MenuSelectDetail } from "../../shared/menu/menu.types.js";

/**
 * A primary action button fused to a second, chevron-only button that opens
 * a drill-down menu of related actions (`items` — see `ui-menu-button`'s own
 * doc comment for the menu mechanics, identical here since both share
 * shared/menu/menu-core.ts + menu-popup.ts). The two segments are separate
 * real `<button>`s (not one button plus a click-region split in two) so
 * each keeps its own native focus/activation and can be `disabled`
 * independently of the other were a caller ever to need that — though both
 * currently share this component's single `disabled` property.
 *
 * The primary segment's label is the default slot, `prefix`/`suffix` named
 * slots flank it — all identical to `ui-button`'s own slot contract, plus
 * the same hand-rolled-rather-than-composed reasoning `ui-menu-button`'s
 * doc comment explains (the chevron segment's ARIA needs to land on a real
 * `<button>` `ui-button` doesn't expose).
 */
@customElement("ui-split-button")
export class SplitButton extends LitElement {
  #namespace = `ui-split-button-${Math.floor(Math.random() * 1e9)}`;
  #chevronButton!: HTMLButtonElement;
  #primaryButton!: HTMLButtonElement;
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

  @property()
  accessor type: "button" | "submit" | "reset" = "button";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  // The chevron segment's own accessible name — it has no visible text of
  // its own, unlike the primary segment (its default slot).
  @property({ attribute: "menu-label" })
  accessor menuLabel = "More options";

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

  static styles = splitButtonStyles;

  protected firstUpdated() {
    const buttons = this.renderRoot.querySelectorAll("button");
    this.#primaryButton = buttons[0] as HTMLButtonElement;
    this.#chevronButton = buttons[1] as HTMLButtonElement;
    this.#popupLayout = trackPopupLayout({
      // .wrapper, not `this` — see split-button.styles.ts's own comment.
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

  // The primary segment's native click already bubbles out through the
  // shadow boundary as this host's own "click" event (composed by default
  // for a real user interaction) — this only needs to help it act as a
  // submit/reset button, same as ui-button's own #onClick: a shadow-DOM
  // button has no ancestor <form> of its own inside the shadow root.
  #onPrimaryClick() {
    if (this.type === "submit") {
      this.closest("form")?.requestSubmit();
    } else if (this.type === "reset") {
      this.closest("form")?.reset();
    }
  }

  #onChevronClick() {
    if (this.disabled) return;
    this.#menu.toggleMenu(this.items);
  }

  #onChevronKeydown(event: KeyboardEvent) {
    if (this.disabled) return;
    this.#menu.handleTriggerKeydown(this.items, event);
  }

  #onChevronBlur() {
    this.#menu.closeMenu();
  }

  focus(options?: FocusOptions) {
    this.#primaryButton?.focus(options);
  }

  blur() {
    this.#primaryButton?.blur();
    this.#chevronButton?.blur();
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
          class="button segment-primary"
          ?disabled=${this.disabled}
          @click=${this.#onPrimaryClick}
        >
          <slot name="prefix"></slot>
          <slot></slot>
          <slot name="suffix"></slot>
        </button>
        <button
          type="button"
          class="button segment-chevron"
          ?disabled=${this.disabled}
          aria-label=${this.menuLabel}
          aria-haspopup="menu"
          aria-expanded=${this.#menu.open}
          aria-controls="${this.#namespace}-popup"
          aria-activedescendant=${activeId}
          @click=${this.#onChevronClick}
          @keydown=${this.#onChevronKeydown}
          @blur=${this.#onChevronBlur}
        >
          ${chevronDownIcon}
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
    "ui-split-button": SplitButton;
  }
}
