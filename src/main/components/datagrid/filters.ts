import { html } from "lit";
import type { TemplateResult } from "lit";

import "../text-field/text-field.js";
import type { TextField } from "../text-field/text-field.js";
import "../select/select.js";
import type { Select } from "../select/select.js";
import type { DataGridColumn } from "./datagrid.js";

/** What a `DataGridFilterType`'s own `render()` is called with for one column. */
export interface DataGridFilterRenderProps<T> {
  column: DataGridColumn<T>;
  /** The current filter value for this column, `undefined` if not set. Whatever shape this filter type's own `setValue`/`matches` agree on — opaque to the grid itself. */
  value: unknown;
  /** Commits a new filter value; pass `undefined` to clear it. */
  setValue: (value: unknown) => void;
  /** Every distinct raw value seen for this column in `data` mode — empty in `dataSource` mode, which has no complete local dataset to scan (a filter type needing options there, e.g. `selectFilter`, takes them as its own config instead). */
  distinctValues: string[];
}

/**
 * A pluggable per-column filter — encapsulates both how its control renders
 * in the filter row and (`data` mode only) how it matches rows. Implement
 * this directly for a custom filter type; `textFilter()`/`selectFilter()`
 * below are the two built-ins, written the same way a consumer's own would
 * be — nothing about them is special-cased by the grid.
 *
 * A factory (rather than a plain object) is the expected shape whenever a
 * filter type needs to debounce or otherwise hold state across renders (see
 * `textFilter`'s own debounce timer) — the closure it returns must be
 * created fresh per column (`filter: textFilter()`, not one shared instance
 * reused across several `columns` entries), the same way you wouldn't share
 * one `useState` across unrelated components.
 */
export interface DataGridFilterType<T = unknown> {
  /** Renders the control shown in this column's filter row cell. */
  render(props: DataGridFilterRenderProps<T>): TemplateResult;
  /**
   * `data` mode only — does `cellValue` (this column's raw value for a row)
   * match the current filter `value`? Never called in `dataSource` mode:
   * there, `value` is simply forwarded as-is on `DataGridDataRequest.filters`
   * for the caller's own backend to interpret.
   */
  matches(value: unknown, cellValue: unknown, row: T): boolean;
}

/**
 * A case-insensitive "contains" text filter — a `ui-text-field`, debounced
 * so typing doesn't refilter on every keystroke. Value is a plain `string`.
 */
export function textFilter<T = unknown>(config?: {
  placeholder?: string;
  debounceMs?: number;
}): DataGridFilterType<T> {
  const placeholder = config?.placeholder ?? "Filter…";
  const debounceMs = config?.debounceMs ?? 300;
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    render({ value, setValue }) {
      return html`
        <ui-text-field
          size="small"
          placeholder=${placeholder}
          .value=${typeof value === "string" ? value : ""}
          @input=${(event: Event) => {
            const next = (event.target as TextField).value;
            clearTimeout(timer);
            timer = setTimeout(() => {
              setValue(next === "" ? undefined : next);
            }, debounceMs);
          }}
        ></ui-text-field>
      `;
    },
    matches(value, cellValue) {
      return String(cellValue ?? "")
        .toLowerCase()
        .includes(String(value).toLowerCase());
    },
  };
}

/**
 * A multi-select dropdown matching any of the values currently chosen.
 * Value is a `string[]` (never empty — an empty selection clears the filter
 * entirely, same as text filter's empty string). `options` is required for
 * `dataSource` mode (no complete local dataset to scan there); falls back to
 * every distinct value seen in `data` mode when omitted.
 */
export function selectFilter<T = unknown>(config?: {
  options?: string[];
  placeholder?: string;
}): DataGridFilterType<T> {
  return {
    render({ value, setValue, distinctValues }) {
      const values = Array.isArray(value) ? (value as string[]) : [];
      const options = config?.options ?? distinctValues;
      return html`
        <ui-select
          size="small"
          multiple
          multiple-value-display="text"
          popup-portal
          placeholder=${config?.placeholder ?? "(All)"}
          .values=${values}
          @change=${(event: Event) => {
            const next = (event.target as Select).values;
            setValue(next.length === 0 ? undefined : next);
          }}
        >
          ${options.map(
            (option) =>
              html`<ui-option value=${option}>${option}</ui-option>`,
          )}
        </ui-select>
      `;
    },
    matches(value, cellValue) {
      return (value as string[]).includes(String(cellValue ?? ""));
    },
  };
}
