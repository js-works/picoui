// Vanilla-JS core for ui-autocomplete. Owns every part of the feature that
// isn't rendering (the Lit template in autocomplete.ts) or fetching data (the
// caller-supplied `dataSource`): querying/debouncing/aborting, keyboard nav,
// selection, popup visibility, the loading-indicator delay, header/footer
// text, and form association (ElementInternals). Popup placement/flip/
// max-height is delegated to shared/popup-layout.ts's trackPopupLayout —
// originally written here, then extracted once it turned out to have
// nothing autocomplete-specific about it (see that module's header comment
// for why it's measured-rects JS rather than CSS anchor positioning:
// position-try-order: most-height proved unreliable in real-world testing).
// This core never renders — it calls `onChange` whenever there's a new view
// to show and leaves producing that view (the actual markup) entirely to
// the caller.

import { trackPopupLayout } from "../../shared/popup-layout/popup-layout.js";
import { scrollIntoListboxView } from "../../shared/scroll-into-listbox-view.js";

export interface AutocompleteItemGroup {
  label?: string;
  items: string[];
}

export interface AutocompleteResult {
  groups: { label?: string; items: string[] }[];
  limitedTo?: number;
}

// A trait of a *data source* (a plain local filter needs no minimum; a
// paginated server endpoint might need 3 characters before it's worth
// querying at all) — see `localFilter` below for the built-in one.
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

// Default data source when no `dataSource` override is set: filters `items`
// locally, case-insensitively (within each group, if grouped). The delay
// keeps the "loading" state genuinely reachable rather than only
// theoretical, and doubles as a debounce-friendly stand-in for a real server
// round-trip.
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
  // Precomputed so the render layer barely has to reason about state at all.
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

export interface InjectAutocompleteConfig {
  // The custom element instance itself — used for dispatching the "change"
  // event.
  host: HTMLElement;
  // Created by the caller's constructor via host.attachInternals() — same
  // convention as every other form-associated component in this codebase
  // (attachInternals() must be called at most once per element, so it can't
  // also be called in here).
  internals: ElementInternals;
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
  // Queried fresh whenever layout is recomputed (see afterRender) — these only
  // resolve to real elements once the caller has actually rendered the popup.
  getPopupElement: () => HTMLElement | null;
  getListboxElement: () => HTMLElement | null;
  getOptionElement: (selectableIndex: number) => HTMLElement | null;
  onChange: (state: AutocompleteViewState) => void;
}

export interface AutocompleteRenderChanges {
  activeIndex?: boolean;
}

export interface AutocompleteHandle {
  onOptionPointerDown(selectableIndex: number, event: Event): void;
  onRemovePill(item: string, event: Event): void;
  onChevronClick(): void;
  // Called by the caller right after every render, telling the core whether
  // activeIndex changed this pass — the core can't know this on its own
  // since it never renders and so never sees the DOM settle, but scrolling
  // the active option into view needs the real, just-rendered <li>.
  afterRender(changes: AutocompleteRenderChanges): void;
  destroy(): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | File | FormData | null): void;
}

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 200;
// 18em at the default 16px root font-size — the popup's general cap, passed
// to trackPopupLayout, which shrinks it further when the viewport doesn't
// have this much room on whichever side it's placed.
export const MAX_HEIGHT_PX = 288;

export function injectAutocomplete(
  config: InjectAutocompleteConfig,
): AutocompleteHandle {
  const { host, input, internals } = config;
  // Fixed once at setup, like the rest of this file's approach to `multiple`
  // for actual pick logic — everything else (form sync, rendering) re-reads
  // config.getMultiple() live, so toggling `multiple` after setup only half
  // takes effect. Matches this component's existing (pre-refactor) behavior;
  // not a new limitation introduced here.
  const selectionMode = config.getMultiple() ? "multi" : "single";
  // Also fixed once at setup — dataSource itself is re-resolved fresh on every
  // query (see resolveDataSource below), but how many characters it needs
  // before it's worth querying at all is read only this once.
  const minLength =
    (config.getDataSource() ?? localFilter(config.getItems())).minLength ?? 0;

  // --- mutable state -------------------------------------------------------
  let query = "";
  let status: AutocompleteViewState["status"] = "idle";
  let rows: AutocompleteRow[] = [];
  let items: string[] = []; // selectable items, parallel to selectableIndex
  let lastResult: AutocompleteResult | undefined;
  let activeIndex = -1;
  let open = false;
  let selected: string[] = []; // toggle-membership tracking for multi mode only
  let value = config.getValue();
  let values = config.getValues();
  let showLoadingIndicator = false;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let loadingIndicatorTimer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let seq = 0;

  const resolveDataSource = (): AutocompleteDataSource =>
    config.getDataSource() ?? localFilter(config.getItems());

  // --- emit ------------------------------------------------------------------
  function emit(): void {
    const showListbox = open && status === "ready" && rows.length > 0;
    const showLoadingStatus =
      open && status === "loading" && showLoadingIndicator;
    const showEmptyStatus =
      open && status === "ready" && rows.length === 0 && !!query;
    const popupVisible = showListbox || showLoadingStatus || showEmptyStatus;
    // Only shown alongside actual rows — not during loading or "no matches",
    // since there's no meaningful result to describe in either of those.
    const headerContent = showListbox
      ? config.getHeaderText()?.(lastResult, query)
      : undefined;
    const footerContent = showListbox
      ? config.getFooterText()?.(lastResult, query)
      : undefined;

    config.onChange({
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
    });
  }

  // --- loading indicator (delayed so a fast dataSource never flashes it) ----
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

  // --- flatten groups into rows + selectable items --------------------------
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

  // --- querying (debounced + abortable) -------------------------------------
  function runQuery(text: string): void {
    controller?.abort();
    const mySeq = ++seq;
    controller = new AbortController();
    // Reopening after being closed (as opposed to refining an already-open
    // search): the cached rows are from a prior, now-disconnected query, not
    // a stale-but-still-relevant version of this one — showing them would
    // flash irrelevant results until the real ones arrive. Drop them so the
    // popup stays hidden until this query actually resolves, same as the very
    // first query ever.
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
        if (mySeq !== seq) return; // stale
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
      seq++; // invalidate any in-flight
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

  // --- selection -------------------------------------------------------------
  function isToggled(item: string): boolean {
    return selected.includes(item);
  }

  // Multi-select has no single string to submit, so it hands the internals a
  // FormData with one entry per selected value under this element's own
  // `name` — the browser folds those straight into the parent form's
  // submission.
  function syncFormValue(): void {
    if (config.getDisabled()) {
      internals.setFormValue(null);
      return;
    }
    if (config.getMultiple()) {
      const formData = new FormData();
      for (const item of values) formData.append(config.getName(), item);
      internals.setFormValue(formData);
    } else {
      internals.setFormValue(value);
    }
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
      syncFormValue();
      dispatchChange();
      closeList();
      return;
    }

    // multi: toggle, keep open
    selected = isToggled(item)
      ? selected.filter((s) => s !== item)
      : [...selected, item];
    values = selected.slice();
    syncFormValue();
    dispatchChange();
    emit();
  }

  // Removes a specific pill regardless of whether it's currently among the
  // filtered/visible rows.
  function doDeselect(item: string): void {
    if (!isToggled(item)) return;
    selected = selected.filter((s) => s !== item);
    values = selected.slice();
    syncFormValue();
    dispatchChange();
    emit();
  }

  // --- active navigation -----------------------------------------------------
  function move(delta: number): void {
    const count = items.length;
    if (count === 0) return;
    if (!open) {
      open = true;
      // Reopening after a pick (single-select closes on select but leaves
      // activeIndex pointing at what was just picked): keep that position
      // instead of jumping back to the first/last item, as long as it's
      // still a valid index into the current (unchanged since the pick)
      // items array.
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

  // --- DOM event listeners on the input ---------------------------------------
  const onInputEvent = (): void => onQueryText(input.value);

  // Reopens an already-loaded list on refocus without re-querying. But if
  // nothing has ever been queried yet (status is still the initial 'idle'),
  // there's no cached list to reopen — so an autocomplete used purely as a
  // dropdown-list (click it, see every option, no typing required) would
  // never show anything on that very first focus. Running an empty query
  // right away covers that.
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

  // Deferred rather than closing immediately: a mouse pick on a rendered
  // suggestion row typically isn't focusable, so the browser blurs `input`
  // on mousedown, before the row's own click handler (which calls
  // onOptionPointerDown) gets to run. Closing synchronously here would
  // hide/unmount the row first, so its click could land on nothing. Deferring
  // to a macrotask lets that click run first; `onFocus` cancels the pending
  // close if focus comes right back.
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

  // --- layout: scroll-active-into-view needs a live DOM ref to the just-
  // rendered option, so it can only run after a render — see afterRender().
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

  // --- initial sync ------------------------------------------------------------
  syncFormValue();
  emit(); // initial idle state

  return {
    onOptionPointerDown(selectableIndex, event) {
      // Keep focus on the input rather than letting it blur to the option,
      // which would otherwise close the listbox before the click that
      // selects from it lands.
      event.preventDefault();
      doSelect(selectableIndex);
    },

    // Routed through doDeselect (rather than the caller splicing `values`
    // directly) so the internal `selected` toggle-state stays in sync —
    // otherwise re-picking the same item from the dropdown later would
    // desync from what the pills show.
    onRemovePill(item, event) {
      event.preventDefault();
      doDeselect(item);
    },

    // Same toggle affordance as ui-select's trigger chevron. Focusing the
    // input (rather than calling openList() alone) is what actually shows
    // every option when nothing's been typed yet — see onFocus above.
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
      // Called on every render pass, not gated on any specific state field —
      // the popup's visibility (its `hidden` attribute) can flip on a render
      // where none of open/rows/query changed (e.g. the loading-indicator
      // delay flipping `showLoadingIndicator` on its own timer), and
      // trackPopupLayout needs to see every one of those transitions, not
      // just the ones this core happens to name here. update() is cheap and
      // idempotent — it only touches the DOM when something it manages
      // actually needs to change.
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
      input.value = "";
      syncFormValue();
      emit();
    },

    formStateRestoreCallback(state) {
      if (config.getMultiple()) {
        if (state instanceof FormData) {
          values = state.getAll(config.getName()).map(String);
          syncFormValue();
          emit();
        }
        return;
      }
      if (typeof state === "string") {
        value = state;
        input.value = state;
        syncFormValue();
        emit();
      }
    },
  };
}
