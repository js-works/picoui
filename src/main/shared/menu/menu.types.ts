import type { TemplateResult } from "lit";

/**
 * One selectable entry in a `ui-menu-button`/`ui-split-button` menu — an
 * action (`onSelect` fires, then the whole menu closes), a submenu (drills
 * into `items` as a new page instead of firing anything), or a separator
 * (purely visual, never selectable/active). Discriminated on `type`, which
 * defaults to `"action"` so the common flat-list case doesn't need it.
 */
export type MenuEntry = MenuAction | MenuSubmenu | MenuSeparator;

export interface MenuAction {
  type?: "action";
  /** Identifies this entry — echoed back in the `menu-select` event detail
   *  and in `path` (see `MenuSelectDetail`), and used as the React-style key
   *  for active-item tracking across renders. Must be unique among its own
   *  siblings (not globally). */
  value: string;
  label: string;
  icon?: TemplateResult;
  disabled?: boolean;
  /** Flags a destructive action (e.g. "Delete") — rendered in the danger
   *  color, same convention as `DataGridRowAction`'s `appearance: "danger"`. */
  danger?: boolean;
  onSelect?: () => void;
}

export interface MenuSubmenu {
  type: "submenu";
  value: string;
  label: string;
  icon?: TemplateResult;
  disabled?: boolean;
  items: MenuEntry[];
}

export interface MenuSeparator {
  type: "separator";
}

/** Payload of the `menu-select` event, dispatched once an action entry is
 *  picked (by click or keyboard) — after any per-entry `onSelect` runs, and
 *  just before the menu closes. `path` is every ancestor submenu's `value`
 *  leading to this entry, root-first, so a deeply nested pick is still
 *  identifiable without walking the original `items` tree by hand. */
export interface MenuSelectDetail {
  value: string;
  path: string[];
}
