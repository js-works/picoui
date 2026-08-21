import type { Calendar } from '../../calendar.js';
import { I18n } from './i18n.js';

export { GregorianCalendar };

class GregorianCalendar implements Calendar {
  #i18n: I18n;

  constructor(getLocale: () => string) {
    this.#i18n = new I18n(getLocale);
  }

  today() {
    const now = new Date();

    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate()
    };
  }

  formatDate(date: Calendar.Date) {
    const nativeDate = new Date(date.year, date.month - 1, date.day);

    return this.#i18n.formatDate(nativeDate, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: Calendar.Time) {
    const nativeDate = new Date(2000, 0, 1, time.hours, time.minutes);

    return this.#i18n.formatDate(nativeDate, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  convertDate(date: Date): Calendar.Date;
  convertDate(date: Calendar.Date): Date;
  convertDate(date: Date | Calendar.Date): Date | Calendar.Date {
    if (date instanceof Date) {
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      };
    }

    const calendarDate = date as Calendar.Date;
    return new Date(calendarDate.year, calendarDate.month, calendarDate.day);
  }

  getMonthSheet(params: {
    year: number;
    month: number;
    calendarSize?: 'default' | 'minimal' | 'maximal';
    minDate?: Calendar.Date | null;
    maxDate?: Calendar.Date | null;
    showWeekNumbers?: boolean;
    highlightCurrent?: boolean;
    highlightWeekends?: boolean;
    disableWeekends?: boolean;
    selectWeeks?: boolean;
  }): Calendar.MonthSheet {
    const { year, month } = params;
    const firstDayOfWeek = this.#i18n.getFirstDayOfWeek();
    const firstWeekdayOfMonth = new Date(year, month, 1).getDay();
    const dayCountOfCurrMonth = getDayCountOfMonth(year, month);
    const dayCountOfLastMonth = getDayCountOfMonth(year, month - 1);

    const remainingDaysOfLastMonth =
      firstDayOfWeek <= firstWeekdayOfMonth
        ? firstWeekdayOfMonth - firstDayOfWeek
        : 7 - (firstDayOfWeek - firstWeekdayOfMonth);

    let daysToShow = 42;

    if (params.calendarSize !== 'maximal') {
      daysToShow = getDayCountOfMonth(year, month) + remainingDaysOfLastMonth;

      if (daysToShow % 7 > 0) {
        daysToShow += 7 - (daysToShow % 7);
      }
    }

    const dayItems: Calendar.DayItem[] = [];

    for (let i = 0; i < daysToShow; ++i) {
      let itemYear: number;
      let itemMonth: number;
      let itemDay: number;
      let adjacent = false;

      if (i < remainingDaysOfLastMonth) {
        itemDay = dayCountOfLastMonth - remainingDaysOfLastMonth + i + 1;
        itemMonth = month === 0 ? 11 : month - 1;
        itemYear = month === 0 ? year - 1 : year;
        adjacent = true;
      } else {
        itemDay = i - remainingDaysOfLastMonth + 1;

        if (itemDay > dayCountOfCurrMonth) {
          itemDay = itemDay - dayCountOfCurrMonth;
          itemMonth = month === 11 ? 0 : month + 1;
          itemYear = month === 11 ? year + 1 : year;
          adjacent = true;
        } else {
          itemMonth = month;
          itemYear = year;
          adjacent = false;
        }
      }

      const itemDate = { year: itemYear, month: itemMonth, day: itemDay };

      const weekend = this.#i18n
        .getWeekendDays()
        .includes(new Date(itemYear, itemMonth, itemDay).getDay());

      const outOfMinMaxRange = !inDateRange(
        itemDate,
        params.minDate || null,
        params.maxDate || null
      );

      const calendarWeek = params.selectWeeks
        ? this.#i18n.getCalendarWeek(toNativeDate(itemDate))
        : null;

      const today = this.today();

      dayItems.push({
        type: 'day',
        year: itemYear,
        month: itemMonth,
        day: itemDay,
        ...(!calendarWeek
          ? null
          : {
              weekYear: calendarWeek.year,
              weekNumber: calendarWeek.week
            }),
        name: this.#i18n.formatDay(itemDay),
        disabled: (params.disableWeekends && weekend) || outOfMinMaxRange,
        outOfMinMaxRange,
        current: isSameDate(today, itemDate),
        highlighted: !!(params.highlightWeekends && weekend),
        adjacent
      });
    }

    const weekdays: number[] = [];

    for (let i = 0; i < 7; ++i) {
      weekdays.push((i + this.#i18n.getFirstDayOfWeek()) % 7);
    }

    const minMonth = params.minDate
      ? params.minDate.year * 12 + params.minDate.month
      : null;

    const maxMonth = params.maxDate
      ? params.maxDate.year * 12 + params.maxDate.month
      : null;

    const mon = year * 12 + month;

    const previousAvailable =
      mon > 24 && inNumberRange(mon - 1, minMonth, null);

    const previous = !previousAvailable
      ? null
      : month === 0
      ? { year: year - 1, month: 11 }
      : { year, month: month - 1 };

    const nextAvailable = inNumberRange(mon + 1, null, maxMonth);

    const next = !nextAvailable
      ? null
      : month === 11
      ? { year: year + 1, month: 0 }
      : { year, month: month + 1 };

    const nameOfMonth = this.#i18n.formatDate(new Date(year, month, 1), {
      year: 'numeric',
      month: 'long'
    });

    let rowNames: string[] | null = null;

    if (params.showWeekNumbers) {
      rowNames = [];

      for (let i = 0; i < dayItems.length / 7; ++i) {
        // TODO!!!!!!!!!!!
        const item = dayItems[i * 7];

        const weekNumber = this.#i18n.getCalendarWeek(
          new Date(item.year, item.month!, item.day!)
        ).week;

        rowNames.push(this.#i18n.formatWeekNumber(weekNumber));
      }
    }

    const highlightedColumns = params.highlightWeekends
      ? this.#i18n.getWeekendDays().map((it) => (it - firstDayOfWeek + 7) % 7)
      : null;

    return {
      type: 'month',
      name: nameOfMonth,
      items: dayItems,
      columnCount: 7,
      highlightedColumns,
      columnNames: this.#i18n.getWeekdayNames('short', true),
      rowNames,
      previous,
      next
    };
  }

  getYearSheet(params: {
    year: number; //
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
    selectQuarters?: boolean;
  }): Calendar.YearSheet {
    const year = params.year;
    const items: Calendar.MonthItem[] = [];
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const minMonth = params.minDate
      ? params.minDate.year * 12 + params.minDate.month
      : null;

    const maxMonth = params.maxDate
      ? params.maxDate.year * 12 + params.maxDate.month
      : null;

    if (!params.selectQuarters) {
      for (let itemMonth = 0; itemMonth < 12; ++itemMonth) {
        const outOfMinMaxRange = !inNumberRange(
          year * 12 + itemMonth,
          minMonth,
          maxMonth
        );

        items.push({
          type: 'month',
          year,
          month: itemMonth,
          name: this.#i18n.getMonthName(itemMonth, 'short'),
          current: year === currYear && itemMonth === currMonth,
          adjacent: false,
          highlighted: false,
          outOfMinMaxRange,
          disabled: outOfMinMaxRange
        });
      }
    } else {
      for (let quarter = 1; quarter <= 4; ++quarter) {
        items.push({
          type: 'month',
          year,
          month: quarter * 3 - 2,
          name:
            new Intl.DisplayNames(this.#i18n.getLocale(), {
              type: 'dateTimeField'
            }).of('quarter') +
            ' ' +
            this.#i18n.formatNumber(quarter),
          current: false, // TODO
          adjacent: false,
          highlighted: false,
          outOfMinMaxRange: false, // TODO
          disabled: false // TODO
        });
      }
    }

    const minYear = params.minDate ? params.minDate.year : null;
    const maxYear = params.maxDate ? params.maxDate.year : null;

    const previousAvailable =
      year >= 1 && inNumberRange(year - 1, minYear, null);

    const previous = !previousAvailable ? null : { year: year - 1 };
    const nextAvailable = inNumberRange(year + 1, null, maxYear);
    const next = !nextAvailable ? null : { year: year + 1 };

    return {
      type: 'year',
      name: this.#i18n.formatYear(year),
      columnCount: params.selectQuarters ? 2 : 4,
      highlightedColumns: null,
      columnNames: null,
      rowNames: null,
      previous,
      next,
      items: items
    };
  }

  getDecadeSheet(params: {
    year: number; //
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.DecadeSheet {
    const year = params.year;
    const startYear = year - (year % 10) - 1;
    const endYear = startYear + 11;
    const currYear = new Date().getFullYear();
    const yearItems: Calendar.YearItem[] = [];
    const minYear = params.minDate ? params.minDate.year : null;
    const maxYear = params.maxDate ? params.maxDate.year : null;

    for (let itemYear = startYear; itemYear <= endYear; ++itemYear) {
      const adjacent = itemYear === startYear || itemYear === endYear;
      const outOfMinMaxRange = !inNumberRange(itemYear, minYear, maxYear);

      yearItems.push({
        type: 'year',
        year: itemYear,

        name: this.#i18n.formatYear(itemYear),

        current: itemYear === currYear,
        highlighted: false,
        adjacent,
        outOfMinMaxRange,
        disabled: outOfMinMaxRange
      });
    }

    const minDecade = params.minDate
      ? Math.floor(params.minDate.year / 10)
      : null;

    const maxDecade = params.maxDate
      ? Math.floor(params.maxDate.year / 10)
      : null;

    const decade = Math.floor(year / 10);

    const prevAvailable =
      year > 1 || inNumberRange(decade - 1, minDecade, null);

    const previous = !prevAvailable
      ? null
      : { year: Math.floor(((year - 10) / 10) * 10) };

    const nextAvailable = inNumberRange(decade + 1, null, maxDecade);

    const next = !nextAvailable
      ? null
      : { year: Math.floor(((year + 10) / 10) * 10) };

    return {
      type: 'decade',
      name: this.#i18n.formatDecade(year),
      columnCount: 4,
      columnNames: null,
      rowNames: null,
      highlightedColumns: null,
      previous,
      next,
      items: yearItems
    };
  }

  getCenturySheet(params: {
    year: number; //,
    minDate: Calendar.Date | null;
    maxDate: Calendar.Date | null;
  }): Calendar.CenturySheet {
    const year = params.year;
    const startYear = year - (year % 100) - 10;
    const endYear = startYear + 119;
    const currYear = new Date().getFullYear();
    const decadeItems: Calendar.DecadeItem[] = [];

    const minYear = params.minDate
      ? Math.floor(params.minDate.year / 10) * 10
      : null;

    const maxYear = params.maxDate
      ? Math.floor(params.maxDate.year / 10) * 10 + 9
      : null;

    for (let itemYear = startYear; itemYear <= endYear; itemYear += 10) {
      const adjacent = itemYear === startYear || itemYear === endYear - 9;
      const outOfMinMaxRange = !inNumberRange(itemYear, minYear, maxYear);

      decadeItems.push({
        type: 'decade',
        year: itemYear,

        name: this.#i18n
          .formatDecade(itemYear)
          .replaceAll('\u2013', '\u2013\u200B'),

        highlighted: false,
        current: itemYear <= currYear && itemYear + 10 > currYear,
        adjacent,
        outOfMinMaxRange,
        disabled: outOfMinMaxRange
      });
    }

    const minCentury = params.minDate
      ? Math.floor(params.minDate.year / 100)
      : null;

    const maxCentury = params.maxDate
      ? Math.floor(params.maxDate.year / 100)
      : null;

    const century = Math.floor(year / 100);

    const prevAvailable =
      year > 300 && inNumberRange(century - 1, minCentury, maxCentury);

    const previous = !prevAvailable
      ? null
      : { year: Math.floor(((year - 100) / 100) * 100) };

    const nextAvailable = inNumberRange(century + 1, minCentury, maxCentury);

    const next = !nextAvailable
      ? null
      : { year: Math.floor(((year + 100) / 100) * 100) };

    return {
      type: 'century',
      name: this.#i18n.formatCentury(year),
      columnCount: 4,
      columnNames: null,
      highlightedColumns: null,
      rowNames: null,
      items: decadeItems,
      previous,
      next
    };
  }
}

// === local helpers =================================================

function getDayCountOfMonth(year: number, month: number) {
  // we also allow month values less than 0 and greater than 11
  const n = year * 12 + month;
  year = Math.floor(n / 12);
  month = n % 12;

  if (month !== 1) {
    return (month % 7) % 2 === 0 ? 31 : 30;
  }

  return year % 4 !== 0 || (year % 100 === 0 && year % 400 !== 0) ? 28 : 29;
}

function isSameDate(date1: Calendar.Date, date2: Calendar.Date) {
  return (
    date1.year === date2.year &&
    date1.month === date2.month &&
    date1.day === date2.day
  );
}

function toNativeDate(date: Calendar.Date) {
  return new Date(date.year, date.month, date.day);
}

function inDateRange(
  value: Calendar.Date,
  start: Calendar.Date | null,
  end: Calendar.Date | null
) {
  if (start === null && end === null) {
    return true;
  }

  const toNumberOrNull = (date: Calendar.Date | null) =>
    date === null ? null : date.year * 10000 + date.month * 100 + date.day;

  return inNumberRange(
    toNumberOrNull(value)!,
    toNumberOrNull(start),
    toNumberOrNull(end)
  );
}

function inNumberRange(
  value: number,
  start: number | null,
  end: number | null
) {
  if (start === null && end === null) {
    return true;
  }

  if (start === null) {
    return value <= end!;
  } else if (end === null) {
    return value >= start;
  } else {
    return value >= start && value <= end;
  }
}
