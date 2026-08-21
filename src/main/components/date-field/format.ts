// Turning a ui-date-picker `value` into the text ui-date-field displays.
//
// The picker core emits a different raw shape per selection mode — see
// `getSelectionKey`/`getValue` in date-picker/vanilla/date-picker.ts:
//
//   date            2026-08-01
//   dateTime        2026-08-01T14:30
//   dateRange       2026-08-01,2026-08-09          (comma-joined, sorted)
//   dateTimeRange   2026-08-01T09:00,2026-08-09T17:00
//   time            14:30
//   timeRange       09:00,17:00
//   week            2026-W32                       (ISO week year + number)
//   weekRange       2026-W32,2026-W35
//   month           2026-08
//   monthRange      2026-08,2026-11
//   quarter         2026-Q3
//   quarterRange    2026-Q1,2026-Q3
//   year            2026
//   yearRange       2026,2029
//
// Those raw strings stay the component's `value` (locale-independent, stable,
// what a form submits). This module only produces the human-readable text the
// field itself displays.
//
// Every parse here builds a *local* Date from the string's parts rather than
// `new Date(str)`. That matters: the spec parses the bare date forms
// ("2026-08-01", "2026-08", "2026") as UTC, so in any negative-offset zone
// they land on the previous local day — enough to render "Jul 31" for a value
// of 2026-08-01. The upstream version of this component had exactly that bug.

import type { DatePickerSelectionMode } from "../date-picker/date-picker.js";

export type DateFieldSelectionMode = Extract<
  DatePickerSelectionMode,
  | "date"
  | "dateTime"
  | "dateRange"
  | "dateTimeRange"
  | "time"
  | "timeRange"
  | "week"
  | "weekRange"
  | "month"
  | "monthRange"
  | "quarter"
  | "quarterRange"
  | "year"
  | "yearRange"
>;

/** The modes ui-date-field accepts, in the order the demo lists them. */
export const DATE_FIELD_SELECTION_MODES: DateFieldSelectionMode[] = [
  "date",
  "dateTime",
  "dateRange",
  "dateTimeRange",
  "time",
  "timeRange",
  "week",
  "weekRange",
  "month",
  "monthRange",
  "quarter",
  "quarterRange",
  "year",
  "yearRange",
];

// ---- parsing the core's raw shapes into local Dates ----

// `new Date(2026, 1, 31)` doesn't fail on February 31st — it rolls forward to
// March 3rd. So every parse below is checked by reading its own parts back:
// without this, a stored value of "2026-02-31" would *display* as "Mar 3, 2026",
// silently disagreeing with itself. Returning null instead lets the field fall
// back to its placeholder.
function checked(
  date: Date,
  year: number,
  month: number,
  day: number,
): Date | null {
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  return checked(new Date(year, month - 1, day), year, month, day);
}

function parseDayTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match.map(Number);
  if (hours > 23 || minutes > 59) return null;
  return checked(new Date(year, month - 1, day, hours, minutes), year, month, day);
}

function parseMonth(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month] = match.map(Number);
  return checked(new Date(year, month - 1, 1), year, month, 1);
}

function parseYear(value: string): Date | null {
  const match = /^(\d{4})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), 0, 1);
}

// Times carry no date of their own, so they're pinned to today — only the
// hour/minute are ever read back out by the formatters below.
function parseTime(value: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, hours, minutes] = match.map(Number);
  if (hours > 23 || minutes > 59) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// ---- formatting ----

type Parse = (value: string) => Date | null;

// `formatRange` collapses shared parts ("Aug 1 – 9, 2026" rather than
// "Aug 1, 2026 – Aug 9, 2026"), which is exactly what's wanted here and is
// why ranges don't just format both halves and join them with a dash.
function formatRange(
  raw: string,
  lang: string,
  parse: Parse,
  options: Intl.DateTimeFormatOptions,
): string {
  const parts = raw.split(",");
  const start = parse(parts[0]);
  // A range mid-pick has only its first half chosen; showing that single value
  // beats showing nothing until the second click lands.
  const end = parse(parts[parts.length - 1]) ?? start;
  if (!start || !end) return "";
  return new Intl.DateTimeFormat(lang, options).formatRange(start, end);
}

function formatOne(
  raw: string,
  lang: string,
  parse: Parse,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = parse(raw);
  return date ? new Intl.DateTimeFormat(lang, options).format(date) : "";
}

const DAY: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
const DAY_TIME: Intl.DateTimeFormatOptions = { ...DAY, hour: "numeric", minute: "2-digit" };
const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
const MONTH_LONG: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" };
const MONTH_SHORT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
const YEAR: Intl.DateTimeFormatOptions = { year: "numeric" };

/**
 * The display text for a raw picker `value` in `mode`, localized to `lang`.
 * Returns "" for an empty or unparseable value, so the field falls back to its
 * placeholder rather than showing "Invalid Date".
 */
export function formatFieldValue(
  raw: string,
  mode: DateFieldSelectionMode,
  lang: string,
): string {
  if (!raw) return "";

  switch (mode) {
    case "date":
      return formatOne(raw, lang, parseDay, DAY);
    case "dateTime":
      return formatOne(raw, lang, parseDayTime, DAY_TIME);
    case "dateRange":
      return formatRange(raw, lang, parseDay, DAY);
    case "dateTimeRange":
      return formatRange(raw, lang, parseDayTime, DAY_TIME);
    case "time":
      return formatOne(raw, lang, parseTime, TIME);
    case "timeRange":
      return formatRange(raw, lang, parseTime, TIME);
    case "month":
      return formatOne(raw, lang, parseMonth, MONTH_LONG);
    case "monthRange":
      return formatRange(raw, lang, parseMonth, MONTH_SHORT);
    case "year":
      return formatOne(raw, lang, parseYear, YEAR);
    case "yearRange":
      return formatRange(raw, lang, parseYear, YEAR);

    // Weeks and quarters have no Intl representation at all — there is no
    // DateTimeFormat option for "ISO week number" or "calendar quarter" — so
    // these stay close to the raw form, just punctuated for reading. Same
    // approach as upstream, and the reason these two don't localize.
    case "week":
      return raw.replace("-W", " / W");
    case "weekRange":
      return raw.split(",").map((it) => it.replace("-W", " / W")).join(" – ");
    case "quarter":
      return raw.replace("-Q", " / Q");
    case "quarterRange":
      return raw.split(",").map((it) => it.replace("-Q", " / Q")).join(" – ");
  }
}
