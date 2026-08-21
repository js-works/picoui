import { LitElement, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { datagridStyles } from "./datagrid.styles.js";
import { chevronUpIcon } from "./icons/chevron-up.icon.js";
import { chevronDownIcon } from "./icons/chevron-down.icon.js";
import { chevronLeftIcon } from "./icons/chevron-left.icon.js";
import { chevronRightIcon } from "./icons/chevron-right.icon.js";
import { chevronsLeftIcon } from "./icons/chevrons-left.icon.js";
import { chevronsRightIcon } from "./icons/chevrons-right.icon.js";
import { checkSquareIcon } from "./icons/check-square.icon.js";
import { expanderChevronIcon } from "./icons/expander-chevron.icon.js";
import type { DataGridFilterType } from "./filters.js";
import "../button/button.js";
import "../checkbox/checkbox.js";
import type { Checkbox } from "../checkbox/checkbox.js";
import "../number-field/number-field.js";
import type { NumberField } from "../number-field/number-field.js";
import "../select/select.js";
import type { Select } from "../select/select.js";

/**
 * This component's own column shape.
 */
export interface DataGridColumn<T> {
  /** Which field of a row this column reads from. */
  field: keyof T & string;
  /** Column header label. Falls back to `field` if omitted. */
  header?: string;
  /**
   * This column's share of the grid's total width, as a fraction of the sum
   * of every column's own `width` — the same idea as a CSS `fr` unit, which
   * is exactly what this maps onto (`grid-template-columns` gets `${width}fr`
   * per column, plus a fixed-width leading column when `selectionMode` is
   * `"multi"`). A column with `width: 200` next to others left at the
   * default 100 ends up twice as wide as them, whatever the grid's actual
   * pixel width happens to be. Default 100, so leaving every column's width
   * unset divides the available space evenly.
   */
  width?: number;
  /** Whether clicking the header sorts by this column. Defaults to true. */
  sortable?: boolean;
  /**
   * Enables filtering for this column, as a plain control directly beneath
   * the header — a `DataGridFilterType` (see `filters.ts`'s `textFilter()`/
   * `selectFilter()` for the two built-ins, or implement the interface
   * directly for a custom one). Omit for no filter on this column.
   */
  filter?: DataGridFilterType<T>;
  /** Formats the raw cell value for display; defaults to printing it as-is. */
  valueFormatter?: (value: unknown, row: T) => string;
}

/**
 * A group of leaf columns sharing one header label, spanning their combined
 * width — one level only, `columns` are always leaf columns, never nested
 * groups. Has no `width` of its own: a group is exactly as wide as its
 * children's own `width`s sum to. Every leaf column's own header cell —
 * whether it's inside a group or stands alone — sits in the same (second,
 * bottom) header row; a standalone column just leaves the row above it
 * blank, the same space a sibling group's own label occupies, so every
 * column header lines up on one shared baseline regardless of grouping.
 */
export interface DataGridColumnGroup<T> {
  header: string;
  columns: DataGridColumn<T>[];
}

/** One entry of `DataGridColumn.columns` — either a leaf column or a group of them. */
export type DataGridColumnOrGroup<T> = DataGridColumn<T> | DataGridColumnGroup<T>;

function isColumnGroup<T>(
  entry: DataGridColumnOrGroup<T>,
): entry is DataGridColumnGroup<T> {
  return "columns" in entry;
}

/**
 * "none": no selection UI. "single": clicking a row selects it (and only
 * it). "multi": a checkbox column (select-all in the header, one per row) —
 * clicking anywhere on a row toggles its own selection.
 */
export type DataGridSelectionMode = "none" | "single" | "multi";

/**
 * The color selected/hovered rows are tinted — "neutral" (default) or
 * "primary".
 */
export type DataGridSelectionTone = "neutral" | "primary";

/**
 * Per-row expandable detail content — return a `TemplateResult` to give
 * `row` an expander toggle, or `undefined` for rows that have none (a mixed
 * page is fine: only rows this resolves a template for get a toggle). The
 * expander column itself appears whenever this is set at all, whether or
 * not any row on the *current* page actually resolves one — only the
 * header's "expand/collapse all" toggle depends on the current page, and
 * disappears when none of its rows have anything to expand.
 */
export type DataGridRowDetails<T> = (row: T) => TemplateResult | undefined;

/**
 * A toolbar action, rendered as an outlined `ui-button` above the grid.
 * "general" always shows, "single" only at exactly one selected row, "multi"
 * only above that, so e.g. an "Edit" action (needs exactly one target) and a
 * "Delete selected" action (needs several) can coexist without either ever
 * showing when it wouldn't make sense. Requires `selectionMode` to be
 * something other than `"none"` for "single"/"multi" actions to ever become
 * visible.
 */
export interface DataGridAction<T> {
  label: string;
  icon?: TemplateResult;
  type: "general" | "single" | "multi";
  onClick: (selected: T[]) => void;
  disabled?: boolean;
}

/**
 * A per-row action, rendered as a `ui-button` (`variant="link"`) directly in
 * the row itself — a trailing column (header labeled `rowActionsHeader`)
 * that only appears when `rowActions` is non-empty. Unlike `DataGridAction`,
 * this never depends on selection: it always acts on the one row it's
 * rendered in, so there's no "single"/"multi" distinction to make. `disabled`
 * is a predicate (not a static boolean) since whether an action makes sense
 * typically depends on that row's own data.
 */
export interface DataGridRowAction<T> {
  label: string;
  icon?: TemplateResult;
  /**
   * The action button's `ui-button` tone — defaults to "neutral".
   * Set to "danger" for a destructive action (e.g. "Delete") to flag it as
   * such, the same convention `DataGridAction`'s own toolbar buttons use.
   */
  appearance?: "neutral" | "primary" | "danger" | "warning" | "success";
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
}

/** One column's current sort — part of a `DataGridDataRequest`. */
export interface DataGridSort<T> {
  field: keyof T & string;
  direction: "asc" | "desc";
}

/**
 * One column's current filter value, keyed by field in
 * `DataGridDataRequest.filters` — opaque to the grid itself (whatever shape
 * that column's own `DataGridFilterType` produces via `setValue`; a built-in
 * `textFilter` gives a `string`, `selectFilter` a `string[]`, a custom type
 * whatever it defines).
 */
export type DataGridColumnFilter = unknown;

/**
 * What `DataGridDataSource` is called with for one request: the row range
 * currently needed, plus whatever sort/filter state should shape it.
 * `startRow`/`endRow` are a half-open range (`[startRow, endRow)`) — e.g.
 * `{ startRow: 20, endRow: 40 }` asks for rows 20 through 39, matching a
 * `pageSize` of 20 on page 2. `signal` aborts when a later request
 * supersedes this one (a fresh sort/filter/page change before this one
 * resolved).
 */
export interface DataGridDataRequest<T> {
  startRow: number;
  endRow: number;
  /** Empty when unsorted. Only ever one entry — this component doesn't expose multi-column sort. */
  sort: DataGridSort<T>[];
  /** Only present for columns with an active filter. */
  filters: Partial<Record<keyof T & string, DataGridColumnFilter>>;
  signal: AbortSignal;
}

export interface DataGridDataResult<T> {
  /** The rows for the requested `[startRow, endRow)` range. */
  rows: T[];
  /** Total row count across the entire dataset — drives the pagination bar's page count. */
  rowCount: number;
}

/**
 * An async row source — an alternative to `data` for rows that live behind a
 * real request (server-side sort/filter/pagination) rather than already
 * being fully loaded on the client. Every sort, filter, and page change
 * re-invokes this for just the range currently in view. Mutually exclusive
 * with `data`; when both are set, `dataSource` wins and `data` is ignored.
 */
export type DataGridDataSource<T> = (
  request: DataGridDataRequest<T>,
) => Promise<DataGridDataResult<T>>;

/**
 * A vanilla, framework-free datagrid — deliberately a small, simple one:
 * columns, sorting, per-column filters (plain text or a multi-select
 * dropdown), pagination, row selection, and toolbar actions, hand-rolled
 * from a plain CSS Grid rather than handed off to a third-party grid engine.
 * No column resizing, no cell focus/keyboard navigation — this is meant to
 * stay the simple, dependency-free option.
 *
 * Rows come from either `data` (a plain, already-loaded array — filtering,
 * sorting, and pagination all happen locally, synchronously, against that
 * array) or `dataSource` (a `DataGridDataSource` callback, re-invoked for
 * just the current page on every sort/filter/page change — the way a real
 * server-backed grid would work). See `DataGridDataSource`'s own doc for why
 * these are mutually exclusive.
 *
 * Selection is tracked by row object identity (a plain `Set<T>`, no
 * `getRowId`-style concept) — `data`'s own row objects (or, for
 * `dataSource`, whatever objects a request resolves with) need to stay the
 * same references across re-renders for a selection to keep tracking the
 * "same" row; this matters most for `dataSource`, where each request
 * resolves independently — a `dataSource` backed by a stable in-memory store
 * naturally satisfies this by returning slices of the same row objects
 * every time. `selectionTone` (see `DataGridSelectionTone`) is
 * unrelated to any of the above — it only changes the color selected/
 * hovered rows are tinted, not selection behavior itself.
 *
 * This grid needs an explicit height on its container — it does not
 * auto-size to its own row count — set via the `height` property (any CSS
 * length).
 */
@customElement("ui-datagrid")
export class DataGrid<T = unknown> extends LitElement {
  @property({ attribute: false })
  accessor columns: DataGridColumnOrGroup<T>[] = [];

  @property({ attribute: false })
  accessor data: T[] = [];

  @property({ attribute: false })
  accessor dataSource: DataGridDataSource<T> | undefined = undefined;

  @property()
  accessor heading = "";

  @property()
  accessor subheading = "";

  @property({ type: Boolean })
  accessor pagination = true;

  @property({ attribute: "page-size", type: Number })
  accessor pageSize = 20;

  @property({ attribute: false })
  accessor pageSizeOptions: number[] = [10, 20, 50, 100];

  @property({ attribute: "selection-mode", reflect: true })
  accessor selectionMode: DataGridSelectionMode = "none";

  // reflect: true — datagrid.styles.ts's --datagrid-row-accent swap is a
  // plain :host([selection-tone="primary"]) CSS rule, which needs the
  // live property value mirrored onto the actual DOM attribute (Lit doesn't
  // do that by default).
  @property({ attribute: "selection-tone", reflect: true })
  accessor selectionTone: DataGridSelectionTone = "neutral";

  @property({ attribute: false })
  accessor actions: DataGridAction<T>[] = [];

  @property()
  accessor height = "480px";

  @property({ attribute: false })
  accessor rowDetails: DataGridRowDetails<T> | undefined = undefined;

  @property({ attribute: false })
  accessor rowActions: DataGridRowAction<T>[] = [];

  @property({ attribute: "row-actions-header" })
  accessor rowActionsHeader = "";

  // reflect: true — datagrid.styles.ts's zebra striping is a plain
  // :host([stripes]) CSS rule, so the live property value needs mirroring
  // onto the actual DOM attribute (same reason selectionTone reflects
  // above).
  @property({ type: Boolean, reflect: true })
  accessor stripes = false;

  // --- internal state -------------------------------------------------------

  /** The current page's rows — computed locally (`data` mode) or resolved from `dataSource`. */
  @state()
  accessor rows: T[] = [];

  /** Total row count across the whole (filtered) dataset — drives the pagination bar. */
  @state()
  accessor rowCount = 0;

  /** 0-based current page index. */
  @state()
  accessor page = 0;

  @state()
  accessor sort: DataGridSort<T> | undefined = undefined;

  @state()
  accessor filters: Partial<Record<keyof T & string, DataGridColumnFilter>> =
    {};

  @state()
  accessor selected: Set<T> = new Set();

  /** Which rows currently have their `rowDetails` panel open — same by-identity tracking as `selected`. */
  @state()
  accessor expandedRows: Set<T> = new Set();

  // Delayed 200ms so a fast `dataSource` request never flashes this.
  @state()
  accessor showLoadingSpinner = false;

  // The page number the pagination bar's "Page X of Y"/"A to B of C" text
  // (and the page-input's own value) is drawn from — committed alongside
  // `rows`/`rowCount` (in `#refresh()`/`#refreshAsync()`'s resolve callback),
  // not alongside `page` itself. `page` changes synchronously the instant a
  // caller navigates (driving the next request and the nav buttons' own
  // enabled/disabled state and +/-1 arithmetic), but the *text* shouldn't
  // jump ahead of the rows still on screen — while a request is in flight,
  // this still points at the page those (dimmed) rows actually belong to.
  // Plain field, not `@state()`: every assignment happens alongside `rows`/
  // `rowCount` (both already reactive), so Lit re-renders at the right time
  // regardless.
  #displayPage = 0;

  // Same lagging as #displayPage above, and for the same reason — a
  // page-size change is itself a new request (see updated()'s resetsPage),
  // so without this the "A to B of C" text would briefly do its range math
  // with the *new* page size against rows that still belong to the old one,
  // showing a range that matches neither. Committed alongside #displayPage
  // in the exact same two places.
  #displayPageSize = 20;

  #activeRequest?: AbortController;
  #loadingSpinnerTimer?: ReturnType<typeof setTimeout>;
  #ready = false;

  static styles = datagridStyles;

  /** The currently selected rows. */
  get selectedRows(): T[] {
    return [...this.selected];
  }

  #effectivePageSize(): number {
    return this.pagination ? this.pageSize : Number.MAX_SAFE_INTEGER;
  }

  // Grouping is purely a header-display concern — filtering, sorting,
  // widths, and data cells all still work off this flat leaf list exactly
  // as if `columns` had never had any groups in it at all.
  #leafColumns(): DataGridColumn<T>[] {
    return this.columns.flatMap((entry) =>
      isColumnGroup(entry) ? entry.columns : [entry],
    );
  }

  // The `distinctValues` a filter type's own `render()` is passed — every
  // value actually present in `data` for that field. Only meaningful in
  // `data` mode; `dataSource` mode has no complete local dataset to scan
  // (a filter type needing options there takes them as its own config
  // instead, e.g. `selectFilter({ options: [...] })`).
  #distinctValues(field: string): string[] {
    const values = new Set<string>();
    for (const row of this.data) {
      const raw = (row as Record<string, unknown>)[field];
      if (raw !== null && raw !== undefined) values.add(String(raw));
    }
    return [...values].sort();
  }

  #applyFilters(rows: T[]): T[] {
    let result = rows;
    for (const column of this.#leafColumns()) {
      const filterType = column.filter;
      if (!filterType) continue;
      const value = this.filters[column.field];
      if (value === undefined) continue;
      result = result.filter((row) =>
        filterType.matches(
          value,
          (row as Record<string, unknown>)[column.field],
          row,
        ),
      );
    }
    return result;
  }

  #applySort(rows: T[]): T[] {
    const sort = this.sort;
    if (!sort) return rows;
    return rows.slice().sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.field];
      const bv = (b as Record<string, unknown>)[sort.field];
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      return sort.direction === "desc" ? -cmp : cmp;
    });
  }

  // Bridges the plain `data` array (client-side mode) to the same
  // rows/rowCount shape #refreshAsync() produces for `dataSource`, so
  // render() never needs to know which mode is active.
  #refresh(): void {
    if (this.dataSource) {
      this.#refreshAsync();
      return;
    }
    const filtered = this.#applyFilters(this.data);
    const sorted = this.#applySort(filtered);
    const pageSize = this.#effectivePageSize();
    const start = this.page * pageSize;
    this.rows = sorted.slice(start, start + pageSize);
    this.rowCount = sorted.length;
    this.#displayPage = this.page;
    this.#displayPageSize = pageSize;
  }

  #refreshAsync(): void {
    const dataSource = this.dataSource;
    if (!dataSource) return;

    this.#activeRequest?.abort();
    const request = new AbortController();
    this.#activeRequest = request;

    clearTimeout(this.#loadingSpinnerTimer);
    this.#loadingSpinnerTimer = setTimeout(() => {
      this.showLoadingSpinner = true;
    }, 200);

    const pageSize = this.#effectivePageSize();
    const startRow = this.page * pageSize;
    const endRow = startRow + pageSize;

    dataSource({
      startRow,
      endRow,
      sort: this.sort ? [this.sort] : [],
      filters: this.filters,
      signal: request.signal,
    }).then(
      (result) => {
        if (request.signal.aborted) return;
        clearTimeout(this.#loadingSpinnerTimer);
        this.showLoadingSpinner = false;
        this.rows = result.rows;
        this.rowCount = result.rowCount;
        this.#displayPage = this.page;
        this.#displayPageSize = pageSize;
      },
      () => {
        if (request.signal.aborted) return;
        clearTimeout(this.#loadingSpinnerTimer);
        this.showLoadingSpinner = false;
      },
    );
  }

  #toggleSort(column: DataGridColumn<T>): void {
    if (column.sortable === false) return;
    const sort = this.sort;
    if (!sort || sort.field !== column.field) {
      this.sort = { field: column.field, direction: "asc" };
    } else if (sort.direction === "asc") {
      this.sort = { field: column.field, direction: "desc" };
    } else {
      this.sort = undefined;
    }
  }

  #goToPageInput(value: string, pageCount: number): void {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    this.page = Math.min(Math.max(parsed, 1), pageCount) - 1;
  }

  #setFilter(field: keyof T & string, value: DataGridColumnFilter): void {
    const next = { ...this.filters };
    if (value !== undefined) {
      next[field] = value;
    } else {
      delete next[field];
    }
    this.filters = next;
  }

  #isSelected(row: T): boolean {
    return this.selected.has(row);
  }

  #setRowSelected(row: T, value: boolean): void {
    const next = new Set(this.selected);
    if (this.selectionMode === "single") {
      next.clear();
      if (value) next.add(row);
    } else if (value) {
      next.add(row);
    } else {
      next.delete(row);
    }
    this.selected = next;
    this.#emitSelectionChange();
  }

  #setVisibleRowsSelected(value: boolean): void {
    const next = new Set(this.selected);
    for (const row of this.rows) {
      if (value) {
        next.add(row);
      } else {
        next.delete(row);
      }
    }
    this.selected = next;
    this.#emitSelectionChange();
  }

  #emitSelectionChange(): void {
    this.dispatchEvent(
      new CustomEvent("row-selection-change", {
        detail: { selected: [...this.selected] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onRowClick(row: T): void {
    if (this.selectionMode === "single") {
      this.#setRowSelected(row, true);
    } else if (this.selectionMode === "multi") {
      this.#setRowSelected(row, !this.#isSelected(row));
    }
  }

  // Whether the expander column itself should exist at all — purely
  // whether `rowDetails` is configured, independent of the current page's
  // own rows (see `DataGridRowDetails`'s own doc). Whether the current
  // page actually has anything to expand is a separate question, answered
  // by `expandableRows` in render() — that one drives the header's own
  // "expand/collapse all" toggle, not the column's existence.
  #hasRowDetails(): boolean {
    return this.rowDetails !== undefined;
  }

  #toggleRowDetails(row: T): void {
    const next = new Set(this.expandedRows);
    if (next.has(row)) {
      next.delete(row);
    } else {
      next.add(row);
    }
    this.expandedRows = next;
  }

  // Collapses every expandable row on the current page if any of them are
  // currently open, otherwise expands them all — matches the toggle's own
  // rotation, which flips as soon as *any* row is open rather than waiting
  // for all of them.
  #toggleAllRowDetails(expandableRows: T[], anyExpanded: boolean): void {
    const next = new Set(this.expandedRows);
    for (const row of expandableRows) {
      if (anyExpanded) {
        next.delete(row);
      } else {
        next.add(row);
      }
    }
    this.expandedRows = next;
  }

  // `rowActionsWidth` (undefined when `rowActions` is empty) is computed
  // once in `render()` from the header label + every action's own label —
  // not sized via CSS `auto`/`max-content`, since each row here is its own
  // independent grid (a separate `display: grid` `.row`, not one shared
  // table grid); an intrinsic-content track size would drift out of sync
  // between the header, filter, and body rows, each sizing it off only
  // their own (different) cell content.
  #gridTemplateColumns(
    leafColumns: DataGridColumn<T>[],
    hasRowDetails: boolean,
    rowActionsWidth: string | undefined,
  ): string {
    const widths = leafColumns.map((column) => `${column.width ?? 100}fr`);
    const leading = [
      ...(this.selectionMode === "multi" ? ["2.5em"] : []),
      ...(hasRowDetails ? ["2.5em"] : []),
    ];
    const trailing = rowActionsWidth ? [rowActionsWidth] : [];
    return [...leading, ...widths, ...trailing].join(" ");
  }

  protected firstUpdated(): void {
    this.#ready = true;
    this.#refresh();
  }

  protected updated(changed: Map<PropertyKey, unknown>): void {
    if (!this.#ready) return;

    // A page-size or sort change reshuffles which rows land on which page
    // (or where on the page), so a selection made beforehand no longer
    // means the same thing — clear it rather than leave a stale,
    // effectively-arbitrary set of rows selected.
    if ((changed.has("pageSize") || changed.has("sort")) && this.selected.size > 0) {
      this.selected = new Set();
      this.#emitSelectionChange();
    }

    // Sort/filter/page-size/pagination-mode changes jump back to page 0 —
    // staying on, say, page 5 of a now-much-smaller filtered result would
    // just show an empty page. Setting `page` (when it's not already 0)
    // triggers its own `updated()` call, which the `changed.has("page")`
    // branch below then turns into the actual refresh.
    const resetsPage =
      changed.has("sort") ||
      changed.has("filters") ||
      changed.has("pageSize") ||
      changed.has("pagination");
    if (resetsPage && this.page !== 0) {
      this.page = 0;
      return;
    }

    if (
      changed.has("data") ||
      changed.has("dataSource") ||
      changed.has("page") ||
      resetsPage
    ) {
      this.#refresh();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#activeRequest?.abort();
    clearTimeout(this.#loadingSpinnerTimer);
  }

  render() {
    const selected = this.selectedRows;
    const visibleActions = this.actions.filter((action) => {
      switch (action.type) {
        case "general":
          return true;
        case "single":
          return selected.length === 1;
        case "multi":
          return selected.length > 1;
      }
    });

    const leafColumns = this.#leafColumns();
    const hasFilters = leafColumns.some((column) => column.filter);
    const hasRowDetails = this.#hasRowDetails();
    const hasRowActions = this.rowActions.length > 0;
    // The text portion (header label vs. the row's own buttons, whichever is
    // wider — all row-action buttons render side by side in the same row, so
    // it's their labels' *sum*, not their max) is measured in `ch`; the
    // per-button icon (always 1em, see the icon files) + its
    // `size="small"` gap (0.3em, `button.styles.ts`), the `.row-actions-cell`
    // flex gap between multiple buttons, and the cell's own inline padding
    // are all real CSS lengths, not character counts, so they're added via
    // `calc()` against the actual custom properties rather than guessed as
    // more `ch`. `variant="link"` itself contributes no padding/border of
    // its own (see `:host([variant="link"])` in button.styles.ts), so
    // there's no per-button chrome term to add here.
    const rowActionsWidth = hasRowActions
      ? (() => {
          const textCh = Math.max(
            this.rowActionsHeader.length,
            this.rowActions.reduce(
              (sum, action) => sum + action.label.length,
              0,
            ),
          );
          const iconCount = this.rowActions.filter(
            (action) => action.icon,
          ).length;
          const buttonGaps = this.rowActions.length - 1;
          return `calc(${textCh}ch + ${iconCount} * 1.3em + ${buttonGaps} * (var(--ui-spacing-sm) * 2 + 0.5em) + 2 * var(--ui-spacing-md))`;
        })()
      : undefined;
    const detailsColumnStart =
      (hasRowDetails ? 1 : 0) + (this.selectionMode === "multi" ? 1 : 0) + 1;
    const detailsColumnEnd = hasRowActions ? -2 : -1;
    const gridTemplateColumns = this.#gridTemplateColumns(
      leafColumns,
      hasRowDetails,
      rowActionsWidth,
    );

    // Explicit grid-column/grid-row placement for every header cell (rather
    // than relying on implicit auto-placement) — the only way to express a
    // group's own cell spanning several columns in just the first row,
    // while every other header cell (leaf column, grouped or standalone,
    // and the leading/trailing select/expander/actions cells alike) sits
    // in the second, so they all share one baseline. `col` walks the same
    // leading (select/expander) + leaf + trailing (row actions) tracks
    // `gridTemplateColumns` itself describes, so the indices always line
    // up with it.
    let col = 1;
    const checkboxCol = this.selectionMode === "multi" ? col++ : undefined;
    const expanderCol = hasRowDetails ? col++ : undefined;
    const headerEntries = this.columns.map((entry) => {
      if (isColumnGroup(entry)) {
        const startCol = col;
        const children = entry.columns.map((column) => ({
          column,
          col: col++,
        }));
        return {
          kind: "group" as const,
          group: entry,
          startCol,
          endCol: col,
          children,
        };
      }
      return { kind: "column" as const, column: entry, col: col++ };
    });
    const actionsCol = hasRowActions ? col : undefined;
    const allVisibleSelected =
      this.rows.length > 0 && this.rows.every((row) => this.#isSelected(row));
    const someVisibleSelected = this.rows.some((row) => this.#isSelected(row));

    const expandableRows = hasRowDetails
      ? this.rows.filter((row) => this.rowDetails!(row) !== undefined)
      : [];
    // Drives both the "expand/collapse all" toggle's own rotation (open as
    // soon as *any* row's details are — not waiting for all of them) and
    // what clicking it does: collapse everything if anything's open,
    // otherwise expand everything.
    const anyRowDetailsExpanded = expandableRows.some((row) =>
      this.expandedRows.has(row),
    );

    // Rendered once, then placed in whichever row is vertically level with
    // the actual filter controls — the header row itself when there's no
    // filter row, otherwise the filter row, so the "select all"
    // checkbox/"expand all" toggle always sit at the same height as the
    // filter inputs beside them rather than up in the column-title row.
    const selectAllCheckbox = html`
      <ui-checkbox
        .checked=${allVisibleSelected}
        .indeterminate=${someVisibleSelected && !allVisibleSelected}
        ?disabled=${this.rows.length === 0}
        @change=${(event: Event) =>
          this.#setVisibleRowsSelected((event.target as Checkbox).checked)}
      ></ui-checkbox>
    `;
    const expandAllToggle =
      expandableRows.length > 0
        ? html`<ui-button
            variant="link"
            class="expander-toggle ${anyRowDetailsExpanded ? "expanded" : ""}"
            aria-expanded=${anyRowDetailsExpanded}
            aria-label=${anyRowDetailsExpanded
              ? "Collapse all row details"
              : "Expand all row details"}
            @click=${() =>
              this.#toggleAllRowDetails(expandableRows, anyRowDetailsExpanded)}
          >
            ${expanderChevronIcon}
          </ui-button>`
        : nothing;

    const pageSize = this.#effectivePageSize();
    const pageCount = Math.max(1, Math.ceil(this.rowCount / pageSize));
    // Drives the nav buttons' own enabled/disabled state and +/-1 arithmetic
    // — based on `page`/`pageSize` themselves, so it's immediately consistent
    // with clicks (including rapid repeated ones) rather than lagging behind
    // a request.
    const currentPage = Math.min(this.page, pageCount - 1);
    // Drives the pagination bar's own displayed text (see `#displayPage`'s
    // own doc) — lags behind `currentPage`/`pageSize` until the rows it
    // describes have actually loaded. Its own page *count* is derived from
    // `#displayPageSize`, not the (possibly just-changed, not-yet-applied)
    // `pageSize` above — otherwise clamping `displayPage` against a page
    // count built from the new size would still leak that size's effect into
    // the display one render early.
    const displayPageCount = Math.max(
      1,
      Math.ceil(this.rowCount / this.#displayPageSize),
    );
    const displayPage = Math.min(this.#displayPage, displayPageCount - 1);
    const rangeStart =
      this.rowCount === 0 ? 0 : displayPage * this.#displayPageSize + 1;
    const rangeEnd = Math.min(
      rangeStart + this.#displayPageSize - 1,
      this.rowCount,
    );

    return html`
      ${this.heading || this.subheading || visibleActions.length > 0
        ? html`<div class="header">
            ${this.heading || this.subheading
              ? html`<div class="header-text">
                  ${this.heading
                    ? html`<h2 class="heading">${this.heading}</h2>`
                    : nothing}
                  ${this.subheading
                    ? html`<p class="subheading">${this.subheading}</p>`
                    : nothing}
                </div>`
              : nothing}
            ${visibleActions.length > 0
              ? html`<div class="toolbar">
                  ${visibleActions.map(
                    (action) => html`
                      <ui-button
                        tone="neutral"
                        variant="outlined"
                        size="medium"
                        ?disabled=${action.disabled}
                        @click=${() => action.onClick(selected)}
                      >
                        ${action.icon
                          ? html`<span slot="prefix">${action.icon}</span>`
                          : nothing}
                        ${action.label}
                      </ui-button>
                    `,
                  )}
                </div>`
              : nothing}
          </div>`
        : nothing}

      <div class="grid-panel ${this.showLoadingSpinner ? "loading" : ""}">
        <div class="grid-wrapper" style="height: ${this.height}">
          <div class="table" role="table">
            <div class="thead" role="rowgroup">
              <div
                class="row header-row"
                role="row"
                style="grid-template-columns: ${gridTemplateColumns}"
              >
                ${checkboxCol
                  ? html`<div
                      class="cell select-cell"
                      style="grid-column: ${checkboxCol}; grid-row: 2"
                    >
                      ${selectAllCheckbox}
                    </div>`
                  : nothing}
                ${expanderCol
                  ? html`<div
                      class="cell expander-cell"
                      style="grid-column: ${expanderCol}; grid-row: 2"
                    >
                      ${expandAllToggle}
                    </div>`
                  : nothing}
                ${headerEntries.map((entry) => {
                  if (entry.kind === "group") {
                    return html`
                      <div
                        class="cell header-cell group-header-cell"
                        role="columnheader"
                        style="grid-column: ${entry.startCol} / ${entry.endCol}; grid-row: 1"
                      >
                        <span class="header-cell-text"
                          >${entry.group.header}</span
                        >
                      </div>
                      ${entry.children.map(({ column, col }) => {
                        const sortable = column.sortable ?? true;
                        const sortDirection =
                          this.sort?.field === column.field
                            ? this.sort.direction
                            : undefined;
                        return html`
                          <div
                            class="cell header-cell ${sortable
                              ? "sortable"
                              : ""}"
                            role="columnheader"
                            style="grid-column: ${col}; grid-row: 2"
                            @click=${() => this.#toggleSort(column)}
                          >
                            <span class="header-cell-text"
                              >${column.header ?? column.field}</span
                            >
                            ${sortDirection
                              ? html`<span class="sort-icon">
                                  ${sortDirection === "asc"
                                    ? chevronUpIcon
                                    : chevronDownIcon}
                                </span>`
                              : nothing}
                          </div>
                        `;
                      })}
                    `;
                  }
                  const column = entry.column;
                  const sortable = column.sortable ?? true;
                  const sortDirection =
                    this.sort?.field === column.field
                      ? this.sort.direction
                      : undefined;
                  return html`
                    <div
                      class="cell header-cell ${sortable ? "sortable" : ""}"
                      role="columnheader"
                      style="grid-column: ${entry.col}; grid-row: 2"
                      @click=${() => this.#toggleSort(column)}
                    >
                      <span class="header-cell-text"
                        >${column.header ?? column.field}</span
                      >
                      ${sortDirection
                        ? html`<span class="sort-icon">
                            ${sortDirection === "asc"
                              ? chevronUpIcon
                              : chevronDownIcon}
                          </span>`
                        : nothing}
                    </div>
                  `;
                })}
                ${actionsCol
                  ? html`<div
                      class="cell header-cell actions-header-cell"
                      style="grid-column: ${actionsCol}; grid-row: 2"
                    >
                      ${this.rowActionsHeader}
                    </div>`
                  : nothing}
              </div>

              ${hasFilters
                ? html`<div
                    class="row filter-row"
                    role="row"
                    style="grid-template-columns: ${gridTemplateColumns}"
                  >
                    ${this.selectionMode === "multi"
                      ? html`<div class="cell"></div>`
                      : nothing}
                    ${hasRowDetails
                      ? html`<div class="cell"></div>`
                      : nothing}
                    ${leafColumns.map((column) => {
                      return html`
                        <div class="cell filter-cell">
                          ${column.filter
                            ? column.filter.render({
                                column,
                                value: this.filters[column.field],
                                setValue: (value) =>
                                  this.#setFilter(column.field, value),
                                distinctValues: this.#distinctValues(
                                  column.field,
                                ),
                              })
                            : nothing}
                        </div>
                      `;
                    })}
                    ${hasRowActions ? html`<div class="cell"></div>` : nothing}
                  </div>`
                : nothing}
            </div>

            <div class="body-viewport">
              <div class="body" role="rowgroup" ?inert=${this.showLoadingSpinner}>
              ${this.rows.length === 0
                ? html`<div class="empty-message">
                    ${this.showLoadingSpinner ? "" : "No rows"}
                  </div>`
                : this.rows.map((row) => {
                    const isSelected = this.#isSelected(row);
                    const details = this.rowDetails?.(row);
                    const isExpanded =
                      details !== undefined && this.expandedRows.has(row);
                    return html`
                      <div
                        class="row body-row ${isSelected ? "selected" : ""}"
                        role="row"
                        style="grid-template-columns: ${gridTemplateColumns}"
                        @click=${() => this.#onRowClick(row)}
                      >
                        ${this.selectionMode === "multi"
                          ? html`<div class="cell select-cell">
                              <ui-checkbox
                                .checked=${isSelected}
                                @click=${(event: Event) =>
                                  event.stopPropagation()}
                                @change=${(event: Event) =>
                                  this.#setRowSelected(
                                    row,
                                    (event.target as Checkbox).checked,
                                  )}
                              ></ui-checkbox>
                            </div>`
                          : nothing}
                        ${hasRowDetails
                          ? html`<div class="cell expander-cell">
                              ${details !== undefined
                                ? html`<ui-button
                                    variant="link"
                                    class="expander-toggle ${isExpanded
                                      ? "expanded"
                                      : ""}"
                                    aria-expanded=${isExpanded}
                                    aria-label=${isExpanded
                                      ? "Collapse row details"
                                      : "Expand row details"}
                                    @click=${(event: Event) => {
                                      event.stopPropagation();
                                      this.#toggleRowDetails(row);
                                    }}
                                  >
                                    ${expanderChevronIcon}
                                  </ui-button>`
                                : nothing}
                            </div>`
                          : nothing}
                        ${leafColumns.map((column) => {
                          const raw = (row as Record<string, unknown>)[
                            column.field
                          ];
                          const value = column.valueFormatter
                            ? column.valueFormatter(raw, row)
                            : String(raw ?? "");
                          return html`<div class="cell" role="cell">
                            ${value}
                          </div>`;
                        })}
                        ${hasRowActions
                          ? html`<div class="cell row-actions-cell">
                              ${this.rowActions.map(
                                (action) => html`
                                  <ui-button
                                    tone=${action.appearance ?? "neutral"}
                                    variant="link"
                                    size="small"
                                    ?disabled=${action.disabled?.(row) ??
                                    false}
                                    @click=${(event: Event) => {
                                      event.stopPropagation();
                                      action.onClick(row);
                                    }}
                                  >
                                    ${action.icon
                                      ? html`<span slot="prefix"
                                          >${action.icon}</span
                                        >`
                                      : nothing}
                                    ${action.label}
                                  </ui-button>
                                `,
                              )}
                            </div>`
                          : nothing}
                      </div>
                      ${details !== undefined
                        ? html`<div
                            class="row row-details ${isExpanded
                              ? "expanded"
                              : ""} ${isSelected ? "selected" : ""}"
                            role="row"
                            style="grid-template-columns: ${gridTemplateColumns}"
                          >
                            <div
                              class="row-details-content"
                              role="cell"
                              style="grid-column: ${detailsColumnStart} / ${detailsColumnEnd}"
                            >
                              <div class="row-details-inner">${details}</div>
                            </div>
                          </div>`
                        : nothing}
                    `;
                  })}
            </div>
              ${this.showLoadingSpinner
                ? html`<div class="loading-overlay">
                    <span class="spinner"></span>
                  </div>`
                : nothing}
            </div>
          </div>
        </div>

        ${this.pagination
          ? html`<div
              class="pagination-bar"
              ?inert=${this.showLoadingSpinner}
            >
              ${this.selectionMode === "multi"
                ? html`<span class="selection-badge"
                    >${checkSquareIcon}${selected.length}</span
                  >`
                : nothing}
              <span class="page-range"
                >${rangeStart} to ${rangeEnd} of ${this.rowCount}</span
              >
              <div class="page-size-group">
                <!--
                  A real <label for>, not a bare <span>: ui-select is a
                  form-associated custom element (static formAssociated), which
                  makes it a labelable element, so the association is a real one
                  the platform honors (label.control resolves to the ui-select)
                  and the picker gets its accessible name from this text — which
                  a plain span next to it never gave it.

                  What this does NOT buy, despite being a proper label:
                  click-the-label-to-focus/open. Label activation does forward a
                  click to the host, but ui-select's own handler sits on the
                  .trigger inside its shadow root (select.ts's render()), and a
                  host-targeted click doesn't reach into a shadow tree. Verified,
                  not assumed. Making that work is ui-select's call to make (a
                  host-level click/focus handler), not something to fake here.

                  The literal id is safe unqualified: every grid is its own
                  shadow root, so it can't collide with a page's own ids or
                  another grid's.

                  Not ui-select's own \`label\` property (which renders this same
                  markup inside the component): that one stacks the label above
                  the control, and this footer needs it inline beside it.
                -->
                <label class="page-label" for="page-size">Page Size:</label>
                <ui-select
                  id="page-size"
                  class="page-size"
                  size="small"
                  .value=${String(this.pageSize)}
                  @change=${(event: Event) => {
                    this.pageSize = Number((event.target as Select).value);
                  }}
                >
                  ${this.pageSizeOptions.map(
                    (size) =>
                      html`<ui-option value=${String(size)}>${size}</ui-option>`,
                  )}
                </ui-select>
              </div>
              <div class="page-nav">
                <ui-button
                  tone="neutral"
                  variant="subtle"
                  style="--btn-font-size: 1.1em; --btn-padding-block: 0.2em; --btn-padding-inline: 0.3em;"
                  aria-label="First page"
                  ?disabled=${currentPage === 0}
                  @click=${() => {
                    this.page = 0;
                  }}
                >
                  ${chevronsLeftIcon}
                </ui-button>
                <ui-button
                  tone="neutral"
                  variant="subtle"
                  style="--btn-font-size: 1.1em; --btn-padding-block: 0.2em; --btn-padding-inline: 0.3em;"
                  aria-label="Previous page"
                  ?disabled=${currentPage === 0}
                  @click=${() => {
                    this.page = currentPage - 1;
                  }}
                >
                  ${chevronLeftIcon}
                </ui-button>
                <!--
                  Same as the Page Size label above: a real <label for>, so the
                  page input gets its accessible name from this word and clicking
                  it focuses the input (ui-number-field is form-associated, and
                  wires up shared/label-focus for the focus half). The trailing
                  "of N" beside it stays a plain span — that one is prose about
                  the input, not a name for it.
                -->
                <label class="page-label" for="page-input">Page</label>
                <ui-number-field
                  id="page-input"
                  class="page-input"
                  size="small"
                  hide-stepper
                  centered
                  .value=${String(displayPage + 1)}
                  @keydown=${(event: KeyboardEvent) => {
                    if (event.key === "Enter") {
                      (event.target as NumberField).blur();
                    }
                  }}
                  @change=${(event: Event) =>
                    this.#goToPageInput(
                      (event.target as NumberField).value,
                      pageCount,
                    )}
                ></ui-number-field>
                <span class="page-label">of ${pageCount}</span>
                <ui-button
                  tone="neutral"
                  variant="subtle"
                  style="--btn-font-size: 1.1em; --btn-padding-block: 0.2em; --btn-padding-inline: 0.3em;"
                  aria-label="Next page"
                  ?disabled=${currentPage >= pageCount - 1}
                  @click=${() => {
                    this.page = currentPage + 1;
                  }}
                >
                  ${chevronRightIcon}
                </ui-button>
                <ui-button
                  tone="neutral"
                  variant="subtle"
                  style="--btn-font-size: 1.1em; --btn-padding-block: 0.2em; --btn-padding-inline: 0.3em;"
                  aria-label="Last page"
                  ?disabled=${currentPage >= pageCount - 1}
                  @click=${() => {
                    this.page = pageCount - 1;
                  }}
                >
                  ${chevronsRightIcon}
                </ui-button>
              </div>
            </div>`
          : nothing}
        </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-datagrid": DataGrid;
  }
}
