import { css, unsafeCSS } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { DatePicker as Picker } from "./vanilla/date-picker.js";

/**
 * The vanilla core's own stylesheet, plus the bridge that maps its `--cal-*`
 * tokens onto this library's `--ui-*` theme.
 *
 * The core ships its CSS as a plain string (`DatePicker.styles`, a
 * `date-picker.styles.ts` default export) rather than a Lit `CSSResult`,
 * deliberately — it has no Lit dependency and must stay usable from any
 * framework, so `unsafeCSS` is where that string re-enters Lit. The core
 * itself is never edited to suit this wrapper; everything framework- or
 * design-system-specific lives in the bridge below.
 *
 * The upstream version of this bridge mapped `--cal-*` onto Shoelace's
 * `--sl-*` tokens. Every one of those is remapped here to the `--ui-*`
 * equivalent, so the picker inherits this library's theme — and, because
 * those tokens are `light-dark()` pairs (see themes/theme.ts), gets dark
 * mode for free without a single dark-specific rule.
 */
export const datePickerStyles = [
  defaultTheme,
  unsafeCSS(Picker.styles),
  css`
    :host {
      display: inline-block;
      font-family: var(--ui-font-sans);
    }

    /* Every --cal-* custom property the core's stylesheet actually reads, in
       the order the core groups them. Note this sets all of them: the
       upstream Shoelace bridge left eight unset (--cal-cell-hover-color,
       --cal-header-hover-color, --cal-header-active-color, both
       --cal-header-accentuated-{hover,active}-color, --cal-nav-color,
       --cal-nav-active-background-color) so those var() lookups fell back to
       nothing at all — and it set --cal-cell-adjacent-disabled-color while
       the core reads --cal-cell-adjacent-disable-color (no "d"), so that one
       never connected either. Both are among the flaws to sort out properly
       later; for now the names below are matched to what the core reads. */
    .base {
      /* type */
      --cal-font-family: var(--ui-font-sans);
      --cal-font-size: var(--ui-font-size-md);
      --cal-color: var(--ui-text);
      --cal-background-color: transparent;
      --cal-border-color: var(--ui-color-neutral-300);

      /* header (month/year title and its prev/next controls). No
         --cal-header-color: the core colours the whole header — title and
         arrows alike — from --cal-nav-color below, so setting it here did
         nothing. See the note there. */
      --cal-header-background-color: transparent;
      --cal-header-hover-color: var(--ui-text);
      --cal-header-hover-background-color: var(--ui-color-primary-100);
      --cal-header-active-color: var(--ui-text);
      --cal-header-active-background-color: var(--ui-color-primary-200);
      --cal-header-accentuated-color: var(--ui-color-on-accent);
      --cal-header-accentuated-background-color: var(--ui-color-primary-600);
      --cal-header-accentuated-hover-color: var(--ui-color-on-accent);
      --cal-header-accentuated-hover-background-color: var(--ui-color-primary-700);
      --cal-header-accentuated-active-color: var(--ui-color-on-accent);
      --cal-header-accentuated-active-background-color: var(--ui-color-primary-800);

      /* nav arrows — and, as it happens, the header title too: the core sets
         .cal-header's colour from this one token, so the month/year label is
         muted along with the arrows. Now that the header behind them is
         transparent rather than a filled bar, the title arguably wants full
         --ui-text contrast with only the arrows muted; that needs the core to
         read --cal-header-color for the header and this for .cal-prev/.cal-next.
         Left alone for now so this doesn't change how the header looks
         unasked.
         -active-background-color is gone: it was only ever read as the
         *resting* header background, which is a bug the core no longer has. */
      --cal-nav-color: var(--ui-color-neutral-600);

      /* the keyboard focus ring on a time column */
      --cal-focus-ring-color: var(--ui-color-primary-500);

      /* grid cells */
      --cal-cell-hover-color: var(--ui-text);
      --cal-cell-hover-background-color: var(--ui-color-primary-100);
      --cal-cell-disabled-color: var(--ui-color-neutral-400);
      --cal-cell-highlighted-background-color: var(--ui-color-neutral-100);
      --cal-cell-adjacent-color: var(--ui-color-neutral-400);
      --cal-cell-adjacent-disable-color: var(--ui-color-neutral-300);
      --cal-cell-current-highlighted-color: var(--ui-color-primary-600);
      --cal-cell-selected-color: var(--ui-color-on-accent);
      --cal-cell-selected-background-color: var(--ui-color-primary-500);
      --cal-cell-selected-hover-background-color: var(--ui-color-primary-600);
      --cal-cell-selection-range-background-color: var(--ui-color-primary-100);

      /* time selector — the hour/minute option columns read the cell and
         button tokens above rather than having any of their own. The nine
         --cal-slider-* tokens that used to be set here went with the range
         sliders they styled (see the core's #renderTimeSelector). */

      /* The tint the inactive From:/To: tab takes on hover. Neutral, not an
         accent: it signals "interactive" without competing with the accent that
         marks the selection — the same idiom as ui-button's outlined hover,
         ui-tab and ui-select's option rows. (Was --cal-button-background-color
         at primary-100; renamed because this tab hover is the only thing that
         ever read it.) */
      --cal-tab-hover-background-color: var(--ui-color-neutral-100);

      /* The one radius the picker rounds everything to: hour/minute options,
         selected cells, and a selection range's own row ends. */
      --cal-button-border-radius: var(--ui-radius-md);
    }

    /* Breathing room between the month/year header row and the sheet below it,
       which the core leaves flush (.cal-base is a plain flex column with no
       gap). A margin on the header alone rather than a gap on .cal-base: the
       core puts other things in that same column — the time links under a
       sheet in calendar+time mode, and the From:/To: tabs above the time
       selector in the time views — and none of those asked for extra spacing.

       em, so it tracks the picker's own font-size (--cal-font-size, mapped to
       --ui-font-size-md above) and therefore --ui-scale, like the core's own
       em-based sizing. This is a design-system decision, so it lives in the
       bridge: the core is never edited to suit this wrapper (see the
       file comment above). */
    .cal-header {
      margin-block-end: 0.0625em;
    }
  `,
];
