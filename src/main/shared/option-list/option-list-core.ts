// The framework-agnostic engine shared by `ui-select` and `ui-combobox` — the
// two components that drive a listbox of slotted `<ui-option>` children and,
// before this, reimplemented the same logic side by side: option enumeration,
// collision-safe `aria-activedescendant` ids, active-option tracking (+ scroll
// into view), mirroring `selected`/`active`/`multiple` onto the options,
// open/close, keyboard navigation, single-pick vs multi-toggle, form value +
// validity, and the form-lifecycle callbacks.
//
// Composition, not inheritance: the host constructs one of these and drives it
// from its own event handlers. NO Lit import — same as `menu-core.ts` /
// `autocomplete-core.ts`. The host is passed in directly and the engine
// reads/writes its `value`/`values` (and reads `multiple`/`disabled`/etc.) as
// plain properties, so the host's own change detection still fires. A handful of
// `on*` options let each host splice in its own bits (the `<input>` text,
// `ui-combobox`'s filter, focus target).

import { scrollIntoListboxView } from "../scroll-into-listbox-view.js";
import {
  buildMultiFormData,
  togglePillValue,
  removePillValue,
} from "../pills/pill-values.js";

export { OptionListController };
export type { OptionListItem, OptionListHost, OptionListOptions };

// Mixed into every generated option id (see #setActive) alongside the counter
// below, so ids stay collision-safe against another copy of this module bundled
// elsewhere on the page.
const instanceId = Math.floor(Math.random() * 1e9);
let nextOptionId = 0;

// The slice of `<ui-option>`'s surface the engine touches — structural, so
// `shared/` takes no dependency on the component.
interface OptionListItem extends HTMLElement {
  value: string;
  label: string;
  disabled: boolean;
  selected: boolean;
  active: boolean;
  multiple: boolean;
}

// The slice of the host component's surface the engine reads and writes. Both
// `ui-select` and `ui-combobox` expose exactly these as reactive properties.
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
  // The scrollable listbox (for scroll-into-view) and the element `setValidity`
  // anchors to / focus returns to after a pick. Resolve lazily — they only
  // exist once the host has rendered.
  listbox: () => HTMLElement | null;
  anchor: () => HTMLElement | null;
  focusControl: () => void;

  // The user moved the active option with the keyboard — `ui-combobox` previews
  // its label in the input. Not fired while typing/filtering or on (re)open.
  onActiveKeyNav?: (option: OptionListItem) => void;
  // The list closed (Escape/blur/chevron, or as part of a single pick) —
  // `ui-combobox` clears its query/filter and settles the input text.
  onClose?: () => void;
  // A multi-select option was toggled (list stays open) — `ui-combobox` resets
  // its search text/filter and re-resolves the active option.
  onAfterToggle?: (option: OptionListItem) => void;
  onFormReset?: () => void;
  onFormRestore?: (state: string) => void;
}

class OptionListController {
  #host: OptionListHost;
  #internals: ElementInternals;
  #opts: OptionListOptions;
  #open = false;
  #active: OptionListItem | undefined;
  // Options we assigned an id to (a slotted `<ui-option>` is the consumer's
  // element — we only touch its id when it has none, and only while it's active).
  #generatedIdOptions = new WeakSet<OptionListItem>();

  constructor(
    host: OptionListHost,
    internals: ElementInternals,
    options: OptionListOptions,
  ) {
    this.#host = host;
    this.#internals = internals;
    this.#opts = options;
  }

  get open(): boolean {
    return this.#open;
  }

  get activeOption(): OptionListItem | undefined {
    return this.#active;
  }

  // --- option enumeration -------------------------------------------------

  options(): OptionListItem[] {
    return [
      ...this.#host.querySelectorAll<HTMLElement>("ui-option"),
    ] as OptionListItem[];
  }

  // `!disabled` and `!hidden` (the latter set by `ui-combobox`'s filter; a
  // no-op for `ui-select`).
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

  // --- active option ---------------------------------------------------

  setActive(option: OptionListItem | undefined): void {
    if (this.#active === option) return;
    for (const other of this.options()) other.active = false;
    if (this.#active && this.#generatedIdOptions.delete(this.#active)) {
      this.#active.removeAttribute("id");
    }
    this.#active = option;
    if (option) {
      if (!option.id) {
        option.id = `ui-option-${instanceId}-${++nextOptionId}`;
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
  // visible, else the first option (or nothing, if the list is empty).
  activateForOpen(): void {
    const options = this.visibleOptions();
    const selected = options.find((o) => o.value === this.#host.value);
    this.setActive(selected ?? options[0]);
  }

  // --- open / close --------------------------------------------------

  openList(): void {
    if (this.#open || this.#host.disabled) return;
    this.#open = true;
    this.activateForOpen();
    this.#opts.onChange();
  }

  closeList(): void {
    this.setOpen(false);
  }

  // `ui-combobox` opening *while the user types* wants the first filtered option
  // active, not the current pick, so it calls this + its own `setActive` rather
  // than `openList()`.
  setOpen(open: boolean): void {
    if (this.#open === open) return;
    this.#open = open;
    if (!open) {
      this.setActive(undefined);
      this.#opts.onClose?.();
    }
    this.#opts.onChange();
  }

  // --- selection ----------------------------------------------------

  commitActive(): void {
    if (!this.#active) return;
    if (this.#host.multiple) this.toggleMulti(this.#active);
    else this.commitSingle(this.#active);
  }

  commitSingle(option: OptionListItem): void {
    const changed = this.#host.value !== option.value;
    this.#host.value = option.value;
    // Only tear down the highlight when closing an open popup — `ui-select`'s
    // always-visible `inline` listbox (never `open`) keeps its highlight on the
    // picked option, like a native `<select size>`.
    if (this.#open) {
      this.#open = false;
      this.setActive(undefined);
      this.#opts.onClose?.(); // after the value change, so onClose reads the new pick
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

  // --- keyboard ---------------------------------------------------

  // The navigation keys both hosts handle identically: Arrow up/down (opening
  // when closed), Home/End and Escape (open only). Returns whether it consumed
  // the event; the host handles the keys that differ (Enter, Space, Tab).
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
      "ui-option",
    ) as OptionListItem | null;
    if (!option || option.disabled || option.hidden) return;
    if (this.#host.multiple) this.toggleMulti(option);
    else this.commitSingle(option);
  }

  // --- form association ------------------------------------------

  syncFormValue(): void {
    const { multiple, disabled, name, value, values } = this.#host;
    if (disabled) {
      this.#internals.setFormValue(null);
    } else if (multiple) {
      this.#internals.setFormValue(buildMultiFormData(name, values));
    } else {
      this.#internals.setFormValue(value || null);
    }
  }

  syncValidity(): void {
    const anchor = this.#opts.anchor();
    if (!anchor) return;
    const { multiple, required, value, values } = this.#host;
    const flags: ValidityStateFlags = {};
    let message = "";
    if (required && !(multiple ? values.length > 0 : !!value)) {
      flags.valueMissing = true;
      message = "Please select an option.";
    }
    this.#internals.setValidity(flags, message, anchor);
    this.#host.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  setCustomValidity(message: string): void {
    if (message) {
      this.#internals.setValidity(
        { customError: true },
        message,
        this.#opts.anchor() ?? undefined,
      );
    } else {
      this.syncValidity();
    }
  }

  // Called from the host's reactive `updated()` — the value/validity/form syncs
  // both hosts ran identically off the same set of changed props.
  hostUpdated(changed: Map<string, unknown> | { has(key: string): boolean }): void {
    if (changed.has("value") || changed.has("values")) {
      this.syncFormValue();
      this.syncSelected();
      this.syncValidity();
    }
    // `name` is baked into the multi-mode FormData; re-sync if it changes alone.
    if (changed.has("name")) this.syncFormValue();
    if (changed.has("required")) this.syncValidity();
  }

  formResetCallback(): void {
    this.#host.value = "";
    this.#host.values = [];
    this.#opts.onFormReset?.();
    this.syncFormValue();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
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
