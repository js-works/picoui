export type { Calendar };

namespace Calendar {
  export type Date = {
    year: number;
    month: number;
    day: number;
  };

  export type Time = {
    hours: number;
    minutes: number;
  };

  export interface MonthSheet extends BaseSheet<'month', DayItem> {}
  export interface YearSheet extends BaseSheet<'year', MonthItem> {}
  export interface DecadeSheet extends BaseSheet<'decade', YearItem> {}
  export interface CenturySheet extends BaseSheet<'century', DecadeItem> {}

  export type Sheet = MonthSheet | YearSheet | DecadeSheet | CenturySheet;
  export type Item = DayItem | MonthItem | YearItem | DecadeItem;

  export interface DayItem extends BaseItem<'day'> {
    year: number;
    month: number;
    day: number;
    weekYear?: number;
    weekNumber?: number;
  }

  export interface MonthItem extends BaseItem<'month'> {
    year: number;
    month: number;
  }

  export interface YearItem extends BaseItem<'year'> {
    year: number;
  }

  export interface DecadeItem extends BaseItem<'decade'> {
    year: number;
  }

  // --- local types -------------------------------------------------

  type BaseSheet<S extends string, T extends BaseItem<string>> = {
    type: S;
    name: string;
    previous: { year: number; month?: number } | null;
    next: { year: number; month?: number } | null;
    columnCount: number;
    highlightedColumns: number[] | null;
    columnNames: string[] | null;
    rowNames: string[] | null;
    items: T[];
  };

  type BaseItem<T extends string> = {
    type: T;
    name: string;
    current: boolean;
    highlighted: boolean;
    adjacent: boolean;
    disabled: boolean;
    outOfMinMaxRange: boolean;
  };
}

interface Calendar {
  today(): Calendar.Date;
  formatDate(date: Calendar.Date): string;
  formatTime(time: Calendar.Time): string;
  convertDate(date: Date): Calendar.Date;
  convertDate(date: Calendar.Date): Date;

  getMonthSheet(params: {
    year: number;
    month: number;
    selectWeeks: boolean;
    calendarSize: 'default' | 'minimal' | 'maximal';
    showWeekNumbers: boolean;
    highlightCurrent: boolean;
    highlightWeekends: boolean;
    disableWeekends: boolean;
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.MonthSheet;

  getYearSheet(params: {
    year: number;
    selectQuarters: boolean;
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.YearSheet;

  getDecadeSheet(params: {
    year: number;
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.DecadeSheet;

  getCenturySheet(params: {
    year: number;
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.CenturySheet;
}
