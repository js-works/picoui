export { I18n };
export type { LocaleInfo };

// === locale data ===================================================

// ***********************************************************************
// ** Locale information for "first day of week", or "weekend days", or
// ** "week number" is currently (September 2022) not available in Intl
// ** (see https://github.com/tc39/proposal-intl-locale-info)
// ** so we have to take care of that on our own
// ***********************************************************************

// Source: https://github.com/unicode-cldr/cldr-core/blob/master/supplemental/weekData.json
// Day of week is represented by number (0 = sunday, ..., 6 = saturday).
const firstDayOfWeekData: Record<number, string> = {
  0:
    'AG,AS,AU,BD,BR,BS,BT,BW,BZ,CA,CN,CO,DM,DO,ET,GT,GU,HK,HN,ID,IL,IN,' +
    'JM,JP,KE,KH,KR,LA,MH,MM,MO,MT,MX,MZ,NI,NP,PA,PE,PH,PK,PR,PT,PY,SA,' +
    'SG,SV,TH,TT,TW,UM,US,VE,VI,WS,YE,ZA,ZW',
  1:
    'AD,AI,AL,AM,AN,AR,AT,AX,AZ,BA,BE,BG,BM,BN,BY,CH,CL,CM,CR,CY,CZ,DE,' +
    'DK,EC,EE,ES,FI,FJ,FO,FR,GB,GE,GF,GP,GR,HR,HU,IE,IS,IT,KG,KZ,LB,LI,' +
    'LK,LT,LU,LV,MC,MD,ME,MK,MN,MQ,MY,NL,NO,NZ,PL,RE,RO,RS,RU,SE,SI,SK,' +
    'SM,TJ,TM,TR,UA,UY,UZ,VA,VN,XK',
  5: 'MV',
  6: 'AE,AF,BH,DJ,DZ,EG,IQ,IR,JO,KW,LY,OM,QA,SD,SY'
};

// Source: https://github.com/unicode-cldr/cldr-core/blob/master/supplemental/weekData.json
const weekendData: Record<string, string> = {
  // Friday and Saturday
  '5+6': 'AE,BH,DZ,EG,IL,IQ,JO,KW,LY,OM,QA,SA,SD,SY,YE',

  // Thursday and Friday
  '4+5': 'AF',

  // Sunday
  '6': 'IN,UG',

  // Friday
  '5': 'IR'
};

// === exported types ================================================

type LocaleInfo = Readonly<{
  baseName: string;
  language: string;
  region: string | undefined;
}>;

// === exported classes ==============================================

class I18n {
  static readonly #localeInfoMap = new Map<string, LocaleInfo>();
  static readonly #firstDayOfWeekByCountryCode = new Map<string, number>();
  static readonly #weekendDaysByCountryCode = new Map<
    string,
    Readonly<number[]>
  >();

  static {
    // prepare `first day of week per country` data
    for (const firstDayOfWeek of Object.keys(firstDayOfWeekData)) {
      const firstDay = Number.parseInt(firstDayOfWeek, 10);
      const countryCodes = firstDayOfWeekData[firstDay].split(',');

      countryCodes.forEach((countryCode) => {
        I18n.#firstDayOfWeekByCountryCode.set(countryCode, firstDay);
      });
    }

    // prepare `weekend days per country` data
    for (const [key, value] of Object.entries(weekendData)) {
      const days = Object.freeze(key.split('+').map((it) => parseInt(it)));
      const countryCodes = value.split(',');

      countryCodes.forEach((countryCode) => {
        I18n.#weekendDaysByCountryCode.set(countryCode, days);
      });
    }
  }

  getLocale: () => string;

  get #locale() {
    return this.getLocale();
  }

  constructor(locale: string | (() => string)) {
    this.getLocale = typeof locale === 'function' ? locale : () => locale;
  }

  getLocaleInfo(): LocaleInfo {
    let info = I18n.#localeInfoMap.get(this.#locale);

    if (!info) {
      info = new (Intl as any).Locale(this.#locale); // TODO
      I18n.#localeInfoMap.set(this.#locale, info!);
    }

    return info!;
  }

  // Constructing an Intl formatter is expensive — far more so than using one —
  // and these are called per grid cell: a month sheet formats 42 day names plus
  // a week number per row, so building a formatter each time cost ~3.5ms per
  // sheet, paid again on every click, month change and re-render. Cached by
  // locale + options instead, which takes that to well under a millisecond.
  //
  // Static, so the cache is shared across every I18n instance (and therefore
  // every picker on the page) rather than per-instance. Formatters are immutable
  // and keyed by everything that affects them, so sharing is safe.
  static readonly #dateFormatters = new Map<string, Intl.DateTimeFormat>();
  static readonly #numberFormatters = new Map<string, Intl.NumberFormat>();

  #dateFormatter(options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = this.#locale + '|' + JSON.stringify(options ?? null);
    let formatter = I18n.#dateFormatters.get(key);

    if (!formatter) {
      formatter = new Intl.DateTimeFormat(this.#locale, options);
      I18n.#dateFormatters.set(key, formatter);
    }

    return formatter;
  }

  #numberFormatter(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = this.#locale + '|' + JSON.stringify(options ?? null);
    let formatter = I18n.#numberFormatters.get(key);

    if (!formatter) {
      formatter = new Intl.NumberFormat(this.#locale, options);
      I18n.#numberFormatters.set(key, formatter);
    }

    return formatter;
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
    return this.#dateFormatter(options).format(date);
  }

  formatDateRange(
    date1: Date,
    date2: Date,
    options?: Intl.DateTimeFormatOptions
  ) {
    return this.#dateFormatter(options).formatRange(date1, date2);
  }

  formatNumber(num: number, options?: Intl.NumberFormatOptions) {
    return this.#numberFormatter(options).format(num);
  }

  getFirstDayOfWeek(): number {
    const region = this.getLocaleInfo().region!;

    return region ? I18n.#firstDayOfWeekByCountryCode.get(region) ?? 1 : 1;
  }

  getWeekdayNames(
    format: 'narrow' | 'short' | 'long',
    startWithFirstDayOfWeek = false
  ) {
    const ret: string[] = [];

    const firstIndex = startWithFirstDayOfWeek ? this.getFirstDayOfWeek() : 0;

    for (let i = 0; i < 7; ++i) {
      const n = (i + firstIndex) % 7;
      const date = new Date(2000, 0, n + 2);
      ret.push(this.formatDate(date, { weekday: format }));
    }

    return ret;
  }

  getCalendarWeek(date: Date): {
    year: number;
    week: number;
  } {
    // Code is based on this solution here:
    // https://stackoverflow.com/questions/23781366/date-get-week-number-for-custom-week-start-day
    // TODO - check algorithm
    // fyi: here's another algorithm: https://weeknumber.com/how-to/javascript

    const weekstart = this.getFirstDayOfWeek();
    const target = new Date(date);

    // Replaced offset of (6) with (7 - weekstart)
    const dayNum = (date.getDay() + 7 - weekstart) % 7;
    target.setDate(target.getDate() - dayNum + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);

    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

    return {
      year: month === 0 && week > 5 ? year - 1 : year,
      week
    };
  }

  formatDay(day: number) {
    return this.formatDate(new Date(1970, 0, day), { day: 'numeric' });
  }

  formatWeekNumber(weekNumber: number) {
    return this.formatNumber(weekNumber);
  }

  formatYear(year: number) {
    return this.formatDate(new Date(year, 0, 1), { year: 'numeric' });
  }

  formatDecade(year: number) {
    const startYear = Math.floor(year / 10) * 10;
    const endYear = startYear + 9;

    return this.formatDateRange(
      new Date(startYear, 0, 1),
      new Date(endYear, 0, 1),
      { year: 'numeric' }
    );
  }

  formatCentury(year: number) {
    const startYear = Math.floor(year / 100) * 100;
    const endYear = startYear + 99;

    return this.formatDateRange(
      new Date(startYear, 0, 1),
      new Date(endYear, 0, 1),
      { year: 'numeric' }
    );
  }

  getMonthName(month: number, format: 'long' | 'short' | 'narrow' = 'long') {
    const date = new Date(1970, month, 1);

    return this.formatDate(date, { month: format });
  }

  getWeekendDays(): Readonly<number[]> {
    const region = this.getLocaleInfo().region;

    return region
      ? I18n.#weekendDaysByCountryCode.get(region) || [0, 6]
      : [0, 6];
  }

  getWeekdayName(day: number, format: 'long' | 'short' | 'narrow' = 'long') {
    const date = new Date(1970, 0, 4 + (day % 7));

    return this.formatDate(date, { weekday: format });
  }
}
