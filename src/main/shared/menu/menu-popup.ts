import { html, nothing, type TemplateResult } from "lit";

import type { MenuController } from "./menu-core.js";
import { resolveGroup, resolvePage } from "./menu-core.js";
import type { MenuAction, MenuEntry, MenuSubmenu } from "./menu.types.js";
import { chevronLeftIcon } from "./icons/chevron-left.icon.js";
import { chevronRightIcon } from "./icons/chevron-right.icon.js";

export { renderMenuPopup, menuEntryId };

function isSubmenu(entry: MenuEntry): entry is MenuSubmenu {
  return entry.type === "submenu";
}

// Stable id for one entry's row — namespaced by the host's own instance id
// (so two ui-menu-buttons/ui-split-buttons on the same page never collide)
// and by the full stack path leading to it, not just its own `value` (which
// only has to be unique among its own siblings — see MenuAction's own doc
// comment — so the same string reused at two different nesting depths is
// legal, and does happen simultaneously while a transition briefly renders
// both the "from" and "to" pages at once). Exported so the host component
// can compute the same id for its own trigger's `aria-activedescendant`.
function menuEntryId(namespace: string, stack: readonly string[], value: string): string {
  return `${namespace}-menu-${[...stack, value].join("-")}`;
}

export interface RenderMenuPopupOptions {
  entries: MenuEntry[];
  controller: MenuController;
  namespace: string;
  // Forwarded to the popup's `popover` attribute — mirrors ui-select's own
  // `popupPortal` escape hatch; see popup-layout.ts's `usePopover` option.
  popupPortal: boolean;
}

/**
 * Renders the drill-down popup: a single current page, or — mid
 * drill-in/back — the outgoing and incoming pages overlaid so
 * menu-popup.styles.ts's transform transition can slide between them (see
 * that file's header comment for the layout this depends on). Shared
 * template between `ui-menu-button` and `ui-split-button`; both call this
 * from their own `render()` and own the surrounding trigger markup
 * themselves.
 */
function renderMenuPopup(options: RenderMenuPopupOptions): TemplateResult {
  const { entries, controller, namespace, popupPortal } = options;
  const transition = controller.transition;

  return html`
    <div
      id="${namespace}-popup"
      class="menu-popup ${controller.open ? "" : controller.closing ? "closing" : ""}"
      ?hidden=${!controller.visible}
      popover=${popupPortal ? "manual" : nothing}
      @pointerdown=${(event: Event) => event.preventDefault()}
    >
      <div class="viewport">
        ${transition
          ? html`
              ${renderPage(entries, transition.toStack, {
                namespace,
                controller,
                slot: "in",
                direction: transition.direction,
                phase: transition.phase,
              })}
              ${renderPage(entries, transition.fromStack, {
                namespace,
                controller,
                slot: "out",
                direction: transition.direction,
                phase: transition.phase,
              })}
            `
          : renderPage(entries, controller.stack, {
              namespace,
              controller,
              slot: "settled",
            })}
      </div>
    </div>
  `;
}

interface PageContext {
  namespace: string;
  controller: MenuController;
  slot: "settled" | "in" | "out";
  direction?: "forward" | "backward";
  phase?: "start" | "run";
}

function renderPage(
  entries: MenuEntry[],
  stack: readonly string[],
  context: PageContext,
): TemplateResult {
  const { namespace, controller, slot, direction, phase } = context;
  const page = resolvePage(entries, stack);
  const group = resolveGroup(entries, stack);
  const outgoing = slot === "out";

  const classes = [
    "page",
    slot === "in" ? "page-in" : slot === "out" ? "page-out" : "",
    direction ? `dir-${direction}` : "",
    phase === "run" ? "phase-run" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return html`
    <div class="${classes}" ?inert=${outgoing} aria-hidden=${outgoing ? "true" : nothing}>
      ${group
        ? html`
            <button
              type="button"
              class="menu-header"
              tabindex="-1"
              aria-label="Back"
              @click=${() => controller.back()}
            >
              <span class="menu-back-icon">${chevronLeftIcon}</span>
              <span class="menu-title">${group.label}</span>
            </button>
          `
        : nothing}
      <div class="menu-list" role="menu" aria-label=${group?.label ?? "Menu"}>
        ${page.map((entry) =>
          entry.type === "separator"
            ? html`<div class="menu-separator" role="separator"></div>`
            : renderEntry(entry, stack, { namespace, controller, entries, outgoing }),
        )}
      </div>
    </div>
  `;
}

function renderEntry(
  entry: MenuAction | MenuSubmenu,
  stack: readonly string[],
  context: {
    namespace: string;
    controller: MenuController;
    entries: MenuEntry[];
    outgoing: boolean;
  },
): TemplateResult {
  const { namespace, controller, entries, outgoing } = context;
  // Only rendered as the highlighted row for keyboard nav — a pointer-driven
  // activeValue (see MenuController#setActive) relies on the row's own CSS
  // :hover for its visual instead (menu-popup.styles.ts).
  const isActive =
    !outgoing &&
    !entry.disabled &&
    controller.activeValue === entry.value &&
    controller.activeSource === "keyboard";
  const danger = !isSubmenu(entry) && entry.danger;

  return html`
    <div
      id="${menuEntryId(namespace, stack, entry.value)}"
      class="menu-item ${entry.disabled ? "disabled" : ""} ${danger ? "danger" : ""} ${isActive ? "active" : ""}"
      role="menuitem"
      aria-disabled=${entry.disabled ? "true" : nothing}
      aria-haspopup=${isSubmenu(entry) ? "true" : nothing}
      @click=${() => controller.activate(entries, entry)}
      @pointerenter=${() => {
        if (!entry.disabled) controller.setActive(entry.value);
      }}
    >
      ${entry.icon ? html`<span class="menu-item-icon">${entry.icon}</span>` : nothing}
      <span class="menu-item-label">${entry.label}</span>
      ${isSubmenu(entry)
        ? html`<span class="menu-item-chevron">${chevronRightIcon}</span>`
        : nothing}
    </div>
  `;
}
