import type { MenuEntry, MenuSelectDetail, MenuSubmenu } from "./menu.types.js";

export {
  MenuController,
  MENU_TRANSITION_MS,
  MENU_CLOSE_MS,
  resolvePage,
  resolveGroup,
};
export type { TransitionState };

// Shared by both the TS timer below and menu-popup.styles.ts's CSS
// transition-duration (interpolated there via Lit's css tag, which allows
// bare numbers through) — one constant so the "settle" timer and the actual
// CSS animation can never drift apart. Governs the horizontal page-slide
// (drilling in/backing out) only — see MENU_CLOSE_MS for the whole-popup
// open/close fade, a separate animation.
const MENU_TRANSITION_MS = 150;

// The whole-popup open/close fade's duration, and how long #closeMenu waits
// before actually unmounting (see #closing above).
const MENU_CLOSE_MS = 270;

type Selectable = Exclude<MenuEntry, { type: "separator" }>;

function isSeparator(entry: MenuEntry): entry is { type: "separator" } {
  return entry.type === "separator";
}

function isSubmenu(entry: MenuEntry): entry is MenuSubmenu {
  return entry.type === "submenu";
}

function findEntry(page: MenuEntry[], value: string): MenuEntry | undefined {
  return page.find((entry) => !isSeparator(entry) && entry.value === value);
}

// Walks `stack` (a path of submenu `value`s, root-first) down from `entries`
// to whichever page it currently points at. Resolved fresh from the live
// `entries` on every call (never cached against stale entry objects) so a
// caller replacing its `items` array wholesale — a new array/objects each
// render, same as any other reactive prop — can't leave the stack holding
// dangling references; an unresolvable path just falls back to the empty
// page rather than throwing.
function resolvePage(entries: MenuEntry[], stack: readonly string[]): MenuEntry[] {
  let page = entries;
  for (const value of stack) {
    const found = findEntry(page, value);
    if (!found || !isSubmenu(found)) return [];
    page = found.items;
  }
  return page;
}

function resolveGroup(
  entries: MenuEntry[],
  stack: readonly string[],
): MenuSubmenu | undefined {
  if (stack.length === 0) return undefined;
  const parentPage = resolvePage(entries, stack.slice(0, -1));
  const found = findEntry(parentPage, stack[stack.length - 1]!);
  return found && isSubmenu(found) ? found : undefined;
}

function selectable(page: MenuEntry[]): Selectable[] {
  return page.filter(
    (entry): entry is Selectable => !isSeparator(entry) && !entry.disabled,
  );
}

interface TransitionState {
  fromStack: readonly string[];
  toStack: readonly string[];
  direction: "forward" | "backward";
  // "start": the entering/leaving pages have just mounted at their resting
  // (untransitioned) positions — no `transition` property active yet, so
  // the browser paints this as a plain snapshot. "run": one paint later
  // (see menu-button.ts/split-button.ts's `updated()`, which double-rAFs
  // into this), the actual end-state transform is applied *with* a CSS
  // transition now active, which is what makes it animate rather than jump.
  phase: "start" | "run";
}

export interface MenuControllerConfig {
  // Called after any state change a re-render needs to reflect — wired to
  // the host's own `requestUpdate()`.
  onChange: () => void;
  onSelect: (detail: MenuSelectDetail) => void;
}

/**
 * The framework-agnostic drill-down state machine shared by `ui-menu-button`
 * and `ui-split-button` — open/closed, the navigation stack (which submenu
 * page is showing), which entry is active (highlighted, for keyboard/mouse
 * parity), and the in-flight page transition (for the slide animation
 * `menu-popup.ts` renders). Holds no DOM references of its own; every method
 * that needs to know the current page is handed the live `entries` array so
 * it always resolves against whatever the host's `items` property currently
 * is (see `resolvePage` above).
 *
 * Mirrors `shared/popup-layout/popup-layout.ts`'s own shape: a plain
 * config-in, handle-out factory (here a class, since there's meaningfully
 * more mutable state to expose than that one's `update`/`destroy` pair) that
 * the host drives imperatively from its own event handlers and lifecycle
 * hooks, rather than a Lit-specific abstraction (this package has no
 * precedent for e.g. a `ReactiveController`).
 */
class MenuController {
  #onChange: () => void;
  #onSelect: (detail: MenuSelectDetail) => void;

  #open = false;
  // True for a bit after `open` goes false — the popup stays mounted
  // (`visible` below) so its close animation (menu-popup.styles.ts) can
  // finish playing instead of vanishing mid-fade.
  #closing = false;
  #stack: string[] = [];
  #activeValue: string | undefined;
  // Which input moved #activeValue there last — keyboard nav renders a
  // visible highlight (menu-popup.styles.ts's .active outline), pointer
  // hover relies on the row's own :hover instead, so a mouse resting on one
  // entry and a keyboard cursor left on another (see setActive below) read
  // as distinct, matching ui-select's decoupled hover/[active] treatment.
  #activeSource: "pointer" | "keyboard" = "keyboard";
  #transition: TransitionState | undefined;

  #closeTimer: ReturnType<typeof setTimeout> | undefined;
  #transitionTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(config: MenuControllerConfig) {
    this.#onChange = config.onChange;
    this.#onSelect = config.onSelect;
  }

  get open(): boolean {
    return this.#open;
  }

  // Whether the popup should still be in the DOM at all — true while open,
  // and for MENU_TRANSITION_MS after closing so the exit animation can play.
  get visible(): boolean {
    return this.#open || this.#closing;
  }

  get closing(): boolean {
    return this.#closing;
  }

  get stack(): readonly string[] {
    return this.#stack;
  }

  get activeValue(): string | undefined {
    return this.#activeValue;
  }

  get activeSource(): "pointer" | "keyboard" {
    return this.#activeSource;
  }

  get transition(): TransitionState | undefined {
    return this.#transition;
  }

  currentPage(entries: MenuEntry[]): MenuEntry[] {
    return resolvePage(entries, this.#stack);
  }

  currentGroup(entries: MenuEntry[]): MenuSubmenu | undefined {
    return resolveGroup(entries, this.#stack);
  }

  openMenu(entries: MenuEntry[]): void {
    if (this.#open) return;
    clearTimeout(this.#closeTimer);
    this.#open = true;
    this.#closing = false;
    this.#stack = [];
    this.#transition = undefined;
    this.#activeValue = selectable(this.currentPage(entries))[0]?.value;
    this.#activeSource = "keyboard";
    this.#onChange();
  }

  closeMenu(): void {
    if (!this.#open) return;
    this.#open = false;
    this.#closing = true;
    this.#transition = undefined;
    clearTimeout(this.#transitionTimer);
    this.#onChange();
    clearTimeout(this.#closeTimer);
    this.#closeTimer = setTimeout(() => {
      this.#closing = false;
      this.#stack = [];
      this.#activeValue = undefined;
      this.#onChange();
    }, MENU_CLOSE_MS);
  }

  toggleMenu(entries: MenuEntry[]): void {
    if (this.#open) this.closeMenu();
    else this.openMenu(entries);
  }

  moveActive(entries: MenuEntry[], delta: number): void {
    const items = selectable(this.currentPage(entries));
    if (items.length === 0) return;
    const current = items.findIndex((item) => item.value === this.#activeValue);
    const start = current === -1 ? (delta > 0 ? -1 : items.length) : current;
    const next = Math.min(Math.max(start + delta, 0), items.length - 1);
    this.#activeValue = items[next]?.value;
    this.#activeSource = "keyboard";
    this.#onChange();
  }

  setActiveEdge(entries: MenuEntry[], edge: "first" | "last"): void {
    const items = selectable(this.currentPage(entries));
    if (items.length === 0) return;
    this.#activeValue = edge === "first" ? items[0]!.value : items.at(-1)!.value;
    this.#activeSource = "keyboard";
    this.#onChange();
  }

  // Mouse-driven equivalent of moveActive/setActiveEdge — a row's own
  // pointerenter, so hovering still moves the logical "cursor" the same
  // way arrowing to it would (so Enter right after a hover fires on the
  // hovered row, and aria-activedescendant tracks it) — but tagged as
  // "pointer" so the render layer leaves the keyboard's outline to
  // moveActive/setActiveEdge/etc. and lets the row's own :hover carry the
  // visual instead (see #activeSource above).
  setActive(value: string): void {
    if (this.#activeValue === value && this.#activeSource === "pointer") return;
    this.#activeValue = value;
    this.#activeSource = "pointer";
    this.#onChange();
  }

  // Cycles to the next entry (after the current active one, wrapping)
  // whose label starts with `char` — a menu's equivalent of a native
  // `<select>`'s type-to-jump.
  typeahead(entries: MenuEntry[], char: string): void {
    const items = selectable(this.currentPage(entries));
    if (items.length === 0) return;
    const lower = char.toLowerCase();
    const current = items.findIndex((item) => item.value === this.#activeValue);
    const ordered = [...items.slice(current + 1), ...items.slice(0, current + 1)];
    const match = ordered.find((item) => item.label.toLowerCase().startsWith(lower));
    if (match) {
      this.#activeValue = match.value;
      this.#activeSource = "keyboard";
      this.#onChange();
    }
  }

  drillInto(entries: MenuEntry[], group: MenuSubmenu): void {
    if (group.disabled) return;
    const toStack = [...this.#stack, group.value];
    this.#beginTransition(toStack, "forward");
    this.#stack = toStack;
    this.#activeValue = selectable(resolvePage(entries, toStack))[0]?.value;
    this.#activeSource = "keyboard";
    this.#onChange();
  }

  // Pops one level, returning to whichever page the current one was drilled
  // in from. No-op (returns false) already at the root page.
  back(): boolean {
    if (this.#stack.length === 0) return false;
    const leaving = this.#stack.at(-1)!;
    const toStack = this.#stack.slice(0, -1);
    this.#beginTransition(toStack, "backward");
    this.#stack = toStack;
    // Highlights the submenu entry just backed out of, rather than
    // defaulting to the parent page's first entry — mirrors a native OS
    // menu returning focus to the item that opened the submenu you closed.
    this.#activeValue = leaving;
    this.#activeSource = "keyboard";
    this.#onChange();
    return true;
  }

  activate(entries: MenuEntry[], entry: Selectable): void {
    if (entry.disabled) return;
    if (isSubmenu(entry)) {
      this.drillInto(entries, entry);
      return;
    }
    entry.onSelect?.();
    this.#onSelect({ value: entry.value, path: [...this.#stack, entry.value] });
    this.closeMenu();
  }

  selectActive(entries: MenuEntry[]): void {
    const items = selectable(this.currentPage(entries));
    const active = items.find((item) => item.value === this.#activeValue);
    if (active) this.activate(entries, active);
  }

  // Second half of the double-rAF dance described on TransitionState.phase
  // above — flips the in-flight transition from its resting start position
  // to the real end position, with a CSS transition now active to animate
  // between them. A no-op once the transition has already settled (its
  // timer, started by #beginTransition, may have already cleared it).
  runTransition(): void {
    if (!this.#transition || this.#transition.phase === "run") return;
    this.#transition = { ...this.#transition, phase: "run" };
    this.#onChange();
  }

  #beginTransition(toStack: readonly string[], direction: "forward" | "backward"): void {
    clearTimeout(this.#transitionTimer);
    this.#transition = { fromStack: this.#stack, toStack, direction, phase: "start" };
    this.#transitionTimer = setTimeout(() => {
      this.#transition = undefined;
      this.#onChange();
    }, MENU_TRANSITION_MS);
  }

  // Full keyboard model for the trigger (focus never leaves it — see
  // menu-button.ts's own doc comment for why — so this always runs off the
  // trigger's own keydown, the same shape ui-select's #onTriggerKeydown
  // uses): Up/Down move the active entry; Right (or Enter/Space on an
  // active submenu entry) drills in; Left/Backspace backs out one level;
  // Home/End jump to the page's edges; Enter/Space activates; Escape always
  // closes outright (never just steps back — see the ArrowLeft/Backspace
  // case for that); Tab closes without preventing the tab itself; any other
  // single printable character type-ahead-jumps.
  handleTriggerKeydown(entries: MenuEntry[], event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (this.#open) this.moveActive(entries, 1);
        else this.openMenu(entries);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (this.#open) this.moveActive(entries, -1);
        else this.openMenu(entries);
        break;
      case "ArrowRight": {
        if (!this.#open) {
          event.preventDefault();
          this.openMenu(entries);
          break;
        }
        const items = selectable(this.currentPage(entries));
        const active = items.find((item) => item.value === this.#activeValue);
        if (active && isSubmenu(active)) {
          event.preventDefault();
          this.drillInto(entries, active);
        }
        break;
      }
      case "ArrowLeft":
      case "Backspace":
        if (this.#open && this.#stack.length > 0) {
          event.preventDefault();
          this.back();
        }
        break;
      case "Home":
        if (this.#open) {
          event.preventDefault();
          this.setActiveEdge(entries, "first");
        }
        break;
      case "End":
        if (this.#open) {
          event.preventDefault();
          this.setActiveEdge(entries, "last");
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (this.#open) this.selectActive(entries);
        else this.openMenu(entries);
        break;
      case "Escape":
        if (this.#open) {
          event.preventDefault();
          this.closeMenu();
        }
        break;
      case "Tab":
        this.closeMenu();
        break;
      default:
        if (
          this.#open &&
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          this.typeahead(entries, event.key);
        }
        break;
    }
  }

  destroy(): void {
    clearTimeout(this.#closeTimer);
    clearTimeout(this.#transitionTimer);
  }
}
