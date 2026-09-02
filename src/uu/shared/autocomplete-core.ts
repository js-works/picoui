// Framework-agnostic core for `Autocomplete`. Owns querying/debouncing/
// aborting, keyboard nav, selection, popup visibility, the loading-indicator
// delay, and header/footer text. Popup placement is delegated to
// trackPopupLayout. This core never renders — it calls `onChange` whenever
// there's a new view to show.
//
// Adapted from src/main: it no longer owns `ElementInternals`. Form value is
// derived by `FormControlElement`'s config hook from the host's mirrored
// `value` / `values`; this core just keeps those in step via `onChange` and
// dispatches `change`.

import { trackPopupLayout } from "./popup-layout.js";
import { scrollIntoListboxView } from "./scroll-into-listbox-view.js";

export interface AutocompleteItemGroup {
  label?: string;
  items: string[];
}

export interface AutocompleteResult {
  groups: { label?: string; items: string[] }[];
  limitedTo?: number;
}

export type AutocompleteDataSource = ((
  query: string,
  opts: { signal: AbortSignal },
) => Promise<AutocompleteResult>) & { minLength?: number };

export type AutocompleteRow =
  | { kind: "separator"; label?: string }
  | { kind: "item"; item: string; selectableIndex: number };

function isGroupedItems(
  items: readonly string[] | readonly AutocompleteItemGroup[],
): items is readonly AutocompleteItemGroup[] {
  return items.length > 0 && typeof items[0] !== "string";
}

// Default data source: filters `items` locally, case-insensitively. The delay
// keeps the "loading" state genuinely reachable and doubles as a
// debounce-friendly stand-in for a real server round-trip.
export function localFilter(
  items: readonly string[] | readonly AutocompleteItemGroup[],
  delayMs = 150,
  minLength = 0,
): AutocompleteDataSource {
  const groups: AutocompleteItemGroup[] = isGroupedItems(items)
    ? items.slice()
    : [{ items: items.slice() }];

  const source: AutocompleteDataSource = (query, { signal }) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.trim().toLowerCase();
        const filtered = groups
          .map((group) => ({
            label: group.label,
            items: q
              ? group.items.filter((item) => item.toLowerCase().includes(q))
              : group.items.slice(),
          }))
          .filter((group) => group.items.length > 0);
        resolve({ groups: filtered });
      }, delayMs);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  source.minLength = minLength;
  return source;
}

export interface AutocompleteViewState {
  query: string;
  status: "idle" | "loading" | "ready" | "error";
  rows: AutocompleteRow[];
  activeIndex: number;
  open: boolean;
  value: string;
  values: string[];
  showLoadingIndicator: boolean;
  showListbox: boolean;
  showLoadingStatus: boolean;
  showEmptyStatus: boolean;
  popupVisible: boolean;
  headerContent: string | undefined;
  footerContent: string | undefined;
}

export type AutocompleteHeaderFooterText = (
  result: AutocompleteResult | undefined,
  query: string,
) => string | undefined;

// The view before the core has run (first render, before `injectAutocomplete`).
export const EMPTY_AUTOCOMPLETE_VIEW: AutocompleteViewState = {
  query: "",
  status: "idle",
  rows: [],
  activeIndex: -1,
  open: false,
  value: "",
  values: [],
  showLoadingIndicator: false,
  showListbox: false,
  showLoadingStatus: false,
  showEmptyStatus: false,
  popupVisible: false,
  headerContent: undefined,
  footerContent: undefined,
};

export interface InjectAutocompleteConfig {
  // The custom element instance — used for dispatching "change" and as the
  // popup's positioning anchor.
  host: HTMLElement;
  input: HTMLInputElement;
  getItems: () => string[] | AutocompleteItemGroup[];
  getDataSource: () => AutocompleteDataSource | undefined;
  getMultiple: () => boolean;
  getDisabled: () => boolean;
  getName: () => string;
  getValue: () => string;
  getValues: () => string[];
  getHeaderText: () => AutocompleteHeaderFooterText | undefined;
  getFooterText: () => AutocompleteHeaderFooterText | undefined;
  getPopupElement: () => HTMLElement | null;
  getListboxElement: () => HTMLElement | null;
  getOptionElement: (selectableIndex: number) => HTMLElement | null;
  onChange: (state: AutocompleteViewState) => void;
}

export interface AutocompleteRenderChanges {
  activeIndex?: boolean;
}

export interface AutocompleteHandle {
  // The latest view snapshot — the component reads this in its render function
  // instead of mirroring every field onto itself as reactive state.
  readonly view: AutocompleteViewState;
  onOptionPointerDown(selectableIndex: number, event: Event): void;
  onRemovePill(item: string, event: Event): void;
  onChevronClick(): void;
  afterRender(changes: AutocompleteRenderChanges): void;
  destroy(): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | File | FormData | null): void;
}

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 200;
export const MAX_HEIGHT_PX = 288;

export function injectAutocomplete(
  config: InjectAutocompleteConfig,
): AutocompleteHandle {
  const { host, input } = config;
  const selectionMode = config.getMultiple() ? "multi" : "single";
  const minLength =
    (config.getDataSource() ?? localFilter(config.getItems())).minLength ?? 0;

  // --- mutable state -----------------------------------------------------
  let query = "";
  let status: AutocompleteViewState["status"] = "idle";
  let rows: AutocompleteRow[] = [];
  let items: string[] = [];
  let lastResult: AutocompleteResult | undefined;
  let activeIndex = -1;
  let open = false;
  let selected: string[] = [];
  let value = config.getValue();
  let values = config.getValues();
  let showLoadingIndicator = false;
  let view: AutocompleteViewState = EMPTY_AUTOCOMPLETE_VIEW;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let loadingIndicatorTimer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let seq = 0;

  const resolveDataSource = (): AutocompleteDataSource =>
    config.getDataSource() ?? localFilter(config.getItems());

  function emit(): void {
    const showListbox = open && status === "ready" && rows.length > 0;
    const showLoadingStatus =
      open && status === "loading" && showLoadingIndicator;
    const showEmptyStatus =
      open && status === "ready" && rows.length === 0 && !!query;
    const popupVisible = showListbox || showLoadingStatus || showEmptyStatus;
    const headerContent = showListbox
      ? config.getHeaderText()?.(lastResult, query)
      : undefined;
    const footerContent = showListbox
      ? config.getFooterText()?.(lastResult, query)
      : undefined;

    view = {
      query,
      status,
      rows,
      activeIndex,
      open,
      value,
      values: values.slice(),
      showLoadingIndicator,
      showListbox,
      showLoadingStatus,
      showEmptyStatus,
      popupVisible,
      headerContent,
      footerContent,
    };
    config.onChange(view);
  }

  function updateLoadingIndicator(): void {
    clearTimeout(loadingIndicatorTimer);
    if (status === "loading") {
      loadingIndicatorTimer = setTimeout(() => {
        showLoadingIndicator = true;
        emit();
      }, 100);
    } else if (showLoadingIndicator) {
      showLoadingIndicator = false;
    }
  }

  function flatten(result: AutocompleteResult): void {
    const groups = result.groups.filter((g) => g.items.length > 0);
    const nextRows: AutocompleteRow[] = [];
    const nextItems: string[] = [];
    const showSeparators =
      groups.length > 1 || (groups.length === 1 && !!groups[0].label);

    let idx = 0;
    for (const g of groups) {
      if (showSeparators) nextRows.push({ kind: "separator", label: g.label });
      for (const item of g.items) {
        nextRows.push({ kind: "item", item, selectableIndex: idx });
        nextItems.push(item);
        idx++;
      }
    }
    rows = nextRows;
    items = nextItems;
  }

  function runQuery(text: string): void {
    controller?.abort();
    const mySeq = ++seq;
    controller = new AbortController();
    if (!open) {
      rows = [];
      items = [];
      lastResult = undefined;
    }
    status = "loading";
    activeIndex = -1;
    open = true;
    updateLoadingIndicator();
    emit();

    resolveDataSource()(text, { signal: controller.signal })
      .then((result) => {
        if (mySeq !== seq) return;
        flatten(result);
        lastResult = result;
        status = "ready";
        updateLoadingIndicator();
        emit();
      })
      .catch((err: unknown) => {
        if (mySeq !== seq) return;
        if (err instanceof Error && err.name === "AbortError") return;
        rows = [];
        items = [];
        lastResult = undefined;
        status = "error";
        updateLoadingIndicator();
        emit();
      });
  }

  function onQueryText(text: string): void {
    query = text;
    if (debounceTimer) clearTimeout(debounceTimer);

    if (text.length < minLength) {
      controller?.abort();
      seq++;
      rows = [];
      items = [];
      lastResult = undefined;
      status = "idle";
      activeIndex = -1;
      open = false;
      updateLoadingIndicator();
      emit();
      return;
    }
    debounceTimer = setTimeout(() => runQuery(text), DEBOUNCE_MS);
  }

  function isToggled(item: string): boolean {
    return selected.includes(item);
  }

  function dispatchChange(): void {
    host.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  function doSelect(index: number): void {
    const item = items[index];
    if (item === undefined) return;

    if (selectionMode === "single") {
      selected = [item];
      value = item;
      input.value = value;
      dispatchChange();
      closeList();
      return;
    }

    selected = isToggled(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    values = selected.slice();
    dispatchChange();
    emit();
  }

  function doDeselect(item: string): void {
    if (!isToggled(item)) return;
    selected = selected.filter((s) => s !== item);
    values = selected.slice();
    dispatchChange();
    emit();
  }

  function move(delta: number): void {
    const count = items.length;
    if (count === 0) return;
    if (!open) {
      open = true;
      if (activeIndex < 0 || activeIndex >= count) {
        activeIndex = delta > 0 ? 0 : count - 1;
      }
      emit();
      return;
    }
    let next = activeIndex + delta;
    if (next < 0) next = 0;
    if (next > count - 1) next = count - 1;
    activeIndex = next;
    emit();
  }

  function setActiveEnd(which: "home" | "end"): void {
    const count = items.length;
    if (count === 0) return;
    open = true;
    activeIndex = which === "home" ? 0 : count - 1;
    emit();
  }

  function openList(): void {
    if (open) return;
    open = true;
    emit();
  }

  function closeList(): void {
    if (!open) return;
    open = false;
    activeIndex = -1;
    emit();
  }

  const onInputEvent = (): void => onQueryText(input.value);

  const onFocus = (): void => {
    if (blurTimer) {
      clearTimeout(blurTimer);
      blurTimer = undefined;
    }
    if (items.length > 0) {
      openList();
    } else if (status === "idle") {
      onQueryText("");
    }
  };

  // Deferred rather than closing immediately: a mouse pick on a rendered row
  // blurs `input` on mousedown, before the row's own click handler runs.
  const onBlur = (): void => {
    blurTimer = setTimeout(() => {
      blurTimer = undefined;
      closeList();
    }, 0);
  };

  const onKeydown = (e: Event): void => {
    const ev = e as KeyboardEvent;
    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        ev.preventDefault();
        move(-1);
        break;
      case "PageDown":
        ev.preventDefault();
        move(PAGE_SIZE);
        break;
      case "PageUp":
        ev.preventDefault();
        move(-PAGE_SIZE);
        break;
      case "Home":
        if (open) {
          ev.preventDefault();
          setActiveEnd("home");
        }
        break;
      case "End":
        if (open) {
          ev.preventDefault();
          setActiveEnd("end");
        }
        break;
      case "Enter":
        if (open && activeIndex >= 0) {
          ev.preventDefault();
          doSelect(activeIndex);
        }
        break;
      case "Escape":
        if (open) {
          ev.preventDefault();
          closeList();
        }
        break;
      case "Tab":
        closeList();
        break;
      default:
        break;
    }
  };

  input.addEventListener("input", onInputEvent);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  input.addEventListener("keydown", onKeydown);

  function scrollActiveIntoView(): void {
    const listbox = config.getListboxElement();
    const option = config.getOptionElement(activeIndex);
    if (!listbox || !option) return;
    scrollIntoListboxView(listbox, option);
  }

  const popupLayout = trackPopupLayout({
    getHostElement: () => host,
    getPopupElement: config.getPopupElement,
    maxHeightPx: MAX_HEIGHT_PX,
  });

  emit(); // initial idle state

  return {
    get view() {
      return view;
    },

    onOptionPointerDown(selectableIndex, event) {
      event.preventDefault();
      doSelect(selectableIndex);
    },

    onRemovePill(item, event) {
      event.preventDefault();
      doDeselect(item);
    },

    onChevronClick() {
      if (config.getDisabled()) return;
      if (open) {
        closeList();
      } else {
        input.focus();
        openList();
      }
    },

    afterRender(changes) {
      if (changes.activeIndex && activeIndex >= 0) {
        scrollActiveIntoView();
      }
      popupLayout.update();
    },

    destroy() {
      popupLayout.destroy();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (blurTimer) clearTimeout(blurTimer);
      clearTimeout(loadingIndicatorTimer);
      controller?.abort();
      input.removeEventListener("input", onInputEvent);
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeydown);
    },

    formResetCallback() {
      value = "";
      values = [];
      selected = [];
      input.value = "";
      emit();
    },

    formStateRestoreCallback(state) {
      if (config.getMultiple()) {
        if (state instanceof FormData) {
          values = state.getAll(config.getName()).map(String);
          selected = values.slice();
          emit();
        }
        return;
      }
      if (typeof state === "string") {
        value = state;
        input.value = state;
        emit();
      }
    },
  };
}
