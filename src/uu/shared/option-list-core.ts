// The framework-agnostic engine shared by `Select` and `Combobox` —
// option enumeration, collision-safe `aria-activedescendant` ids,
// active-option tracking (+ scroll into view), mirroring
// `selected`/`active`/`multiple` onto the options, open/close, keyboard
// navigation, and single-pick vs multi-toggle.
//
// Adapted from src/main's OptionListController: it no longer owns
// `ElementInternals` — `FormControlElement` does. Instead it exposes
// `formValue()` / `computeValidity()` / `reset()` / `restore()` for that base's
// config hooks to call, and setting a host property (`value` / `values`) is
// what triggers the base to re-sync.

import { scrollIntoListboxView } from "./scroll-into-listbox-view.js";
import {
  buildMultiFormData,
  togglePillValue,
  removePillValue,
} from "./pill-values.js";
import type { FieldValidity, FormValue } from "../base/form-control-core.js";

export { OptionListController };
export type { OptionListItem, OptionListHost, OptionListOptions };

const instanceId = Math.floor(Math.random() * 1e9);
let nextOptionId = 0;

// The slice of the option element the engine touches — structural.
interface OptionListItem extends HTMLElement {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  active: boolean;
  multiple: boolean;
}

// The slice of the host component the engine reads and writes.
interface OptionListHost extends HTMLElement {
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  name: string;
  value: string;
  values: string[];
}

interface OptionListOptions {
  // Wired to the host's `requestUpdate()` — called after any state change a
  // re-render needs to reflect.
  onChange: () => void;
  // The scrollable listbox (for scroll-into-view) and the element focus
  // returns to after a pick. Resolve lazily — they only exist once rendered.
  listbox: () => HTMLElement | null;
  focusControl: () => void;

  // The user moved the active option with the keyboard — `Combobox` previews
  // its label in the input. Not fired while typing/filtering or on (re)open.
  onActiveKeyNav?: (option: OptionListItem) => void;
  // The list closed — `Combobox` clears its query/filter and settles the
  // input text.
  onClose?: () => void;
  // A multi-select option was toggled (list stays open).
  onAfterToggle?: (option: OptionListItem) => void;
  onFormReset?: () => void;
  onFormRestore?: (state: string) => void;
}

class OptionListController {
  readonly #host: OptionListHost;
  readonly #opts: OptionListOptions;
  #open = false;
  #active: OptionListItem | undefined;
  // Options we assigned an id to — we only touch a slotted option's id when it
  // has none, and only while it's active.
  readonly #generatedIdOptions = new WeakSet<OptionListItem>();

  constructor(host: OptionListHost, options: OptionListOptions) {
    this.#host = host;
    this.#opts = options;
  }

  get open(): boolean {
    return this.#open;
  }

  get activeOption(): OptionListItem | undefined {
    return this.#active;
  }

  // --- option enumeration ---------------------------------------------

  options(): OptionListItem[] {
    return [
      ...this.#host.querySelectorAll<HTMLElement>('[role="option"]'),
    ] as OptionListItem[];
  }

  // `!disabled` and `!hidden` (the latter set by `Combobox`'s filter).
  visibleOptions(): OptionListItem[] {
    return this.options().filter((o) => !o.disabled && !o.hidden);
  }

  get selectedOption(): OptionListItem | undefined {
    return this.options().find((o) => o.value === this.#host.value);
  }

  // Mirror value(s) + mode onto every option (drives their checkmark/checkbox
  // rendering). The host calls this from `updated()` and on slot changes.
  syncSelected(): void {
    const { multiple, values, value } = this.#host;
    for (const option of this.options()) {
      option.multiple = multiple;
      option.selected = multiple
        ? values.includes(option.value)
        : option.value === value;
    }
  }

  // --- active option ------------------------------------------------

  setActive(option: OptionListItem | undefined): void {
    if (this.#active === option) return;
    for (const other of this.options()) other.active = false;
    if (this.#active && this.#generatedIdOptions.delete(this.#active)) {
      this.#active.removeAttribute("id");
    }
    this.#active = option;
    if (option) {
      if (!option.id) {
        option.id = `option-${instanceId}-${++nextOptionId}`;
        this.#generatedIdOptions.add(option);
      }
      option.active = true;
      const listbox = this.#opts.listbox();
      if (listbox) scrollIntoListboxView(listbox, option);
    }
    this.#opts.onChange();
  }

  moveActive(delta: number): void {
    const options = this.visibleOptions();
    if (options.length === 0) return;
    const current = this.#active ? options.indexOf(this.#active) : -1;
    const next = Math.min(Math.max(current + delta, 0), options.length - 1);
    this.setActive(options[next]);
    if (this.#active) this.#opts.onActiveKeyNav?.(this.#active);
  }

  setActiveToEdge(which: "home" | "end"): void {
    const options = this.visibleOptions();
    if (options.length === 0) return;
    this.setActive(which === "home" ? options[0] : options[options.length - 1]);
    if (this.#active) this.#opts.onActiveKeyNav?.(this.#active);
  }

  // Active option for a freshly opened / focused list: the current pick if
  // visible, else the first option.
  activateForOpen(): void {
    const options = this.visibleOptions();
    const selected = options.find((o) => o.value === this.#host.value);
    this.setActive(selected ?? options[0]);
  }

  // --- open / close -----------------------------------------------

  openList(): void {
    if (this.#open || this.#host.disabled) return;
    this.#open = true;
    this.activateForOpen();
    this.#opts.onChange();
  }

  closeList(): void {
    this.setOpen(false);
  }

  // `Combobox` opening *while the user types* wants the first filtered
  // option active, not the current pick, so it calls this + its own
  // `setActive` rather than `openList()`.
  setOpen(open: boolean): void {
    if (this.#open === open) return;
    this.#open = open;
    if (!open) {
      this.setActive(undefined);
      this.#opts.onClose?.();
    }
    this.#opts.onChange();
  }

  // --- selection -------------------------------------------------

  commitActive(): void {
    if (!this.#active) return;
    if (this.#host.multiple) this.toggleMulti(this.#active);
    else this.commitSingle(this.#active);
  }

  commitSingle(option: OptionListItem): void {
    const changed = this.#host.value !== option.value;
    this.#host.value = option.value;
    // Only tear down the highlight when closing an open popup — the
    // always-visible `inline` listbox keeps its highlight on the picked
    // option, like a native `<select size>`.
    if (this.#open) {
      this.#open = false;
      this.setActive(undefined);
      this.#opts.onClose?.();
    }
    this.#opts.focusControl();
    if (changed) this.#dispatchChange();
    this.#opts.onChange();
  }

  toggleMulti(option: OptionListItem): void {
    this.#host.values = togglePillValue(this.#host.values, option.value);
    this.#opts.onAfterToggle?.(option);
    this.#dispatchChange();
    this.#opts.onChange();
  }

  removeValue(value: string): void {
    this.#host.values = removePillValue(this.#host.values, value);
    this.#dispatchChange();
    this.#opts.onChange();
  }

  #dispatchChange(): void {
    this.#host.dispatchEvent(
      new Event("change", { bubbles: true, composed: true }),
    );
  }

  // --- keyboard -------------------------------------------------

  // Arrow up/down (opening when closed), Home/End and Escape (open only).
  // Returns whether it consumed the event; the host handles Enter/Space/Tab.
  handleNavKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (this.#open) this.moveActive(1);
        else this.openList();
        return true;
      case "ArrowUp":
        event.preventDefault();
        if (this.#open) this.moveActive(-1);
        else this.openList();
        return true;
      case "Home":
        if (!this.#open) return false;
        event.preventDefault();
        this.setActiveToEdge("home");
        return true;
      case "End":
        if (!this.#open) return false;
        event.preventDefault();
        this.setActiveToEdge("end");
        return true;
      case "Escape":
        if (!this.#open) return false;
        event.preventDefault();
        this.closeList();
        return true;
      default:
        return false;
    }
  }

  handleListboxClick(event: Event): void {
    const option = (event.target as Element).closest(
      '[role="option"]',
    ) as OptionListItem | null;
    if (!option || option.disabled || option.hidden) return;
    if (this.#host.multiple) this.toggleMulti(option);
    else this.commitSingle(option);
  }

  // --- form participation (for FormControlElement's config hooks) ----

  formValue(): FormValue {
    const { multiple, name, value, values } = this.#host;
    if (multiple) return buildMultiFormData(name, values);
    return value || null;
  }

  computeValidity(): FieldValidity {
    const { multiple, required, value, values } = this.#host;
    if (required && !(multiple ? values.length > 0 : !!value)) {
      return {
        flags: { valueMissing: true },
        message: "Please select an option.",
      };
    }
    return { flags: {}, message: "" };
  }

  reset(): void {
    this.#host.value = "";
    this.#host.values = [];
    this.#opts.onFormReset?.();
  }

  restore(state: string | File | FormData | null): void {
    if (this.#host.multiple) {
      if (state instanceof FormData) {
        this.#host.values = state.getAll(this.#host.name).map(String);
      }
      return;
    }
    if (typeof state === "string") {
      this.#host.value = state;
      this.#opts.onFormRestore?.(state);
    }
  }
}
