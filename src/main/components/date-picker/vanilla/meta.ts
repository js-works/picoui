// === exports =======================================================

export { selectionModeMeta, calendarViewOrder };
export type { CalendarView, TimeView, View };

// == exported types =================================================

export type SelectionMode =
  | 'date'
  | 'dates'
  | 'dateTime'
  | 'dateRange'
  | 'time'
  | 'timeRange'
  | 'dateTimeRange'
  | 'week'
  | 'weeks'
  | 'weekRange'
  | 'month'
  | 'months'
  | 'monthRange'
  | 'quarter'
  | 'quarters'
  | 'quarterRange'
  | 'year'
  | 'years'
  | 'yearRange';

type CalendarView = 'month' | 'year' | 'decade' | 'century';
type TimeView = 'time1' | 'time2';
type View = CalendarView | TimeView;

// === exported values ===============================================

const calendarViewOrder: CalendarView[] = [
  'month',
  'year',
  'decade',
  'century'
];

const selectionModeMeta: Record<
  SelectionMode,
  {
    selectType: 'single' | 'multi' | 'range';
    initialView: Exclude<View, 'time2'>;
    kind: 'calendar' | 'time' | 'calendar+time';
  }
> = {
  date: {
    selectType: 'single',
    initialView: 'month',
    kind: 'calendar'
  },

  dates: {
    selectType: 'multi',
    initialView: 'month',
    kind: 'calendar'
  },

  dateRange: {
    selectType: 'range',
    initialView: 'month',
    kind: 'calendar'
  },

  dateTime: {
    selectType: 'single',
    initialView: 'month',
    kind: 'calendar+time'
  },

  dateTimeRange: {
    selectType: 'range',
    initialView: 'month',
    kind: 'calendar+time'
  },

  time: {
    selectType: 'single',
    initialView: 'time1',
    kind: 'time'
  },

  timeRange: {
    selectType: 'range',
    initialView: 'time1',
    kind: 'time'
  },

  week: {
    selectType: 'single',
    initialView: 'month',
    kind: 'calendar'
  },

  weeks: {
    selectType: 'multi',
    initialView: 'month',
    kind: 'calendar'
  },

  weekRange: {
    selectType: 'range',
    initialView: 'month',
    kind: 'calendar'
  },

  month: {
    selectType: 'single',
    initialView: 'year',
    kind: 'calendar'
  },

  months: {
    selectType: 'multi',
    initialView: 'year',
    kind: 'calendar'
  },

  monthRange: {
    selectType: 'range',
    initialView: 'year',
    kind: 'calendar'
  },

  quarter: {
    selectType: 'single',
    initialView: 'year',
    kind: 'calendar'
  },

  quarters: {
    selectType: 'multi',
    initialView: 'year',
    kind: 'calendar'
  },

  quarterRange: {
    selectType: 'range',
    initialView: 'year',
    kind: 'calendar'
  },

  year: {
    selectType: 'single',
    initialView: 'decade',
    kind: 'calendar'
  },

  years: {
    selectType: 'multi',
    initialView: 'decade',
    kind: 'calendar'
  },

  yearRange: {
    selectType: 'range',
    initialView: 'decade',
    kind: 'calendar'
  }
};
