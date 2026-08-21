// The three icons ui-date-field's trigger button uses, and the mapping from
// selection mode to glyph.
//
// Upstream had fourteen, one per mode (see temp/icons/register-icons.ts's
// `date-field.*` entries, resolved through a Shoelace icon library). They were
// ported and then cut back deliberately: at the size this button actually
// renders them — 1em, so 16px at the default scale — the only distinction that
// survives is shape-level, circle versus rounded square. The per-mode
// differences were all interior detail (a bar for a range, a dot row for a
// week, an "Aug" for a month, a block for a quarter) which turns to mush at
// 16px, so twelve of the fourteen read as the same calendar. They were also
// doing labelling work the field already does twice: it has a visible label and,
// once filled, a formatted value.
//
// What's left is the one thing worth signalling — what kind of popup opens: a
// calendar grid, or the time wheels.
//
// All three are Bootstrap Icons glyphs, filled, sized in em rather than px so
// they scale with the field's font-size.

import { html } from "lit";
import type { TemplateResult } from "lit";

import type { DateFieldSelectionMode } from "./format.js";

/**
 * Bootstrap Icons' "calendar" glyph with the filled header strip — the same
 * family as the other field trigger icons here, so they all read as siblings.
 *
 * overflow="visible": this glyph draws to the very edge of its 16x16 viewBox
 * (the tabs touch y=0, the body x=0/16), and the UA's default style clips a
 * root <svg> to its viewBox at small rendered sizes.
 */
export const calendarIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" overflow="visible">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
  </svg>
`;

/**
 * Bootstrap Icons' "clock". Filled, like `calendarIcon` and `timeRangeIcon`, so
 * all three glyphs share one drawing style — and the same dial and hands as
 * `timeRangeIcon`, so the two clocks read as a pair whose only difference is
 * the dotted stretch that marks a span.
 *
 * Supplied as finished artwork; left byte-for-byte as given.
 *
 * overflow="visible" for the same reason as `calendarIcon`: the outer circle is
 * r=8 about (8,8), so it touches all four edges of the 16x16 viewBox, and the
 * UA's default style clips a root <svg> to its viewBox at small rendered sizes.
 */
export const clockIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" overflow="visible">
    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
  </svg>
`;

/**
 * A clock whose dial is part solid, part dotted — the dotted stretch reading as
 * the span between two times rather than one instant. Filled paths, like
 * `calendarIcon`, so the two of them share a drawing style.
 *
 * Supplied as finished artwork; the three paths are the dotted arc, the solid
 * remainder of the dial, and the hands. Left byte-for-byte as given.
 *
 * overflow="visible" for the same reason as `calendarIcon`: the dotted arc runs
 * to the very edge of the 16x16 viewBox (there's a point at y=0), and the UA's
 * default style clips a root <svg> to its viewBox at small rendered sizes.
 */
export const timeRangeIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" overflow="visible">
    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
  </svg>
`;

// Record, not Partial<Record>, so adding a selection mode to
// DateFieldSelectionMode without deciding its icon is a compile error rather
// than a silently blank trigger button.
export const FIELD_ICONS: Record<DateFieldSelectionMode, TemplateResult> = {
  date: calendarIcon,
  dateTime: calendarIcon,
  dateRange: calendarIcon,
  dateTimeRange: calendarIcon,
  week: calendarIcon,
  weekRange: calendarIcon,
  month: calendarIcon,
  monthRange: calendarIcon,
  quarter: calendarIcon,
  quarterRange: calendarIcon,
  year: calendarIcon,
  yearRange: calendarIcon,
  time: clockIcon,
  timeRange: timeRangeIcon,
};
