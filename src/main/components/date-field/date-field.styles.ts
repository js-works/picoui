import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { fieldLabelStyles } from "../../shared/field-label/field-label.js";

export const dateFieldStyles = [
  defaultTheme,
  fieldLabelStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: block;

      /* size="medium" (the default) — the same --ui-font-size-* tokens every
         other field here uses, so "small"/"medium"/"large" mean the same
         rendered size across ui-text-field, ui-select, ui-date-field, … */
      font-size: var(--field-font-size);
      --field-font-size: var(--ui-font-size-md);
    }

    :host([size="small"]) {
      --field-font-size: var(--ui-font-size-sm);
    }

    :host([size="large"]) {
      --field-font-size: var(--ui-font-size-lg);
    }

    .wrapper {
      display: flex;
      align-items: center;
      padding-inline-end: 0.5rem;
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--ui-field-radius);
      box-sizing: border-box;
      /* Anchor for the popup below — on the wrapper itself, not the input, so
         the popup's left edge lines up with this field's own visible left
         edge rather than sitting a border-width inside it. Every instance is
         in its own shadow root, so one literal name is safe across all of
         them. Distinct from every other component's own anchor name: different
         components, different popups. */
      anchor-name: --ui-date-field-anchor;
    }

    input {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0.5rem;
      font-family: var(--ui-font-sans);
      font-size: var(--field-font-size);
      border: none;
      background: transparent;
      color: inherit;
    }

    input:focus {
      outline: none;
    }

    /* The input is always readonly (the popup is the only way to pick — see
       the class doc), so it reads as a trigger rather than a text box: a
       pointer cursor, and no text caret/selection to suggest otherwise. */
    input:not(:disabled) {
      cursor: pointer;
    }

    :host([readonly]) input,
    :host([disabled]) input {
      cursor: default;
    }

    /* Scoped to .wrapper: this is the gap between the input and its trigger
       button. Unscoped it also hit the popup footer's buttons, indenting Clear
       by an extra 0.4em and leaving the footer visibly off-centre — 23px from
       the card's left edge against OK's 17px on the right. */
    .wrapper ui-button {
      flex: none;
      margin-inline-start: 0.4em;
    }

    :host([invalid]) .wrapper {
      border-color: var(--ui-color-danger-500);
    }

    /* ---- Picker popup ---- */

    .picker-popup {
      position: fixed;
      position-anchor: --ui-date-field-anchor;
      /* Clears the UA's own \`[popover] { inset: 0 }\` before the two insets that
         matter are set. Without it right/bottom stay at 0, so all four insets
         are specified — and position-try-fallbacks flips *inset properties*, so
         flip-block swapped that 0 into \`top\` and pinned the popup to the top of
         the viewport instead of above the field. Only visible once a field sat
         low enough that the popup didn't fit below it. */
      inset: auto;
      top: calc(anchor(bottom) + 0.25rem);
      left: anchor(left);
      /* Flips above the field when there isn't room below. */
      position-try-fallbacks: flip-block;
      margin: 0;
      /* Reset the UA's default popover chrome (a currentColor border plus
         padding) — the visible card is .popup-card inside; this element is
         only the popover host and the anchor target. */
      border: none;
      padding: 0;
      background: transparent;
      /* The UA default is overflow: auto, which — with this element sized to
         hug its content — would clip the card's own box-shadow at its edge
         rather than letting it bleed out. */
      overflow: visible;
    }

    .popup-card {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-md);
      box-shadow: var(--ui-popup-shadow);
      /* Kept from when the picker was flush to these edges: the padding above
         now keeps content off the corners on its own, so this is only a
         guarantee that nothing can ever spill past the radius. Safe either way
         — the time columns scroll within themselves, and the shadow is drawn
         outside the box. */
      overflow: hidden;
      /* Fixed width rather than content-sized: the month/year/decade sheets
         have different natural widths, so without this the popup would resize
         under the cursor as the user drills through the views.

         Sized from the widest thing the core actually produces, measured
         rather than guessed: with this element's border and the picker's own
         inset included, the month sheet with week numbers shown wants 311px and
         the time view 310px. 20.25 × the md font size (324px at the default
         scale) leaves 13px of headroom. Measured at the same width in all of
         en-US, en-GB, es-ES, fr-FR, de-DE, it-IT, ar-SA, hu-HU, pl-PL and
         zh-TW — the cells' own padding sets the width, not the weekday
         captions, so the locale doesn't move it. Anything narrower and the
         week-number column and the weekend highlight bleed out past the
         rounded border; much wider and the flex-grow cells simply spread,
         which undoes the sheet's density.

         Multiplied against --ui-font-size-md, NOT written as a plain \`em\`
         (which resolves against the *field's* font-size): the picker inside is
         not sized by this field at all — date-picker.styles.ts maps its
         --cal-font-size to --ui-font-size-md unconditionally — so its content
         is the same ~311px whatever \`size\` the field is. An em here made the
         card the one thing that tracked the field: size="small" gave a 283.5px
         card around 311px of calendar (the sheet hit its own
         min-width: 17.5em floor and the week-number column bled), and
         size="large" gave 364.5px, 54px of dead space with the cells spread
         thin. Both symptoms the paragraph above warns about, caused by the
         unit rather than the number. Still --ui-scale-tracking, since
         --ui-font-size-md is itself calc(1rem * var(--ui-scale)). */
      width: calc(20.25 * var(--ui-font-size-md));
    }

    /* A small inset. The scale has no step between -sm (4px) and -md (16px) —
       16 was the original and read too airy, flush-to-the-edge too tight — so
       it's derived from -sm rather than written as a literal, and stays on the
       --ui-scale dial.
       Bottom included: below it sits .popup-footer's own top padding, so the
       last row of dates clears the buttons by that plus this. */
    .popup-card ui-date-picker {
      display: block;
      padding: calc(var(--ui-spacing-sm) * 1.5);
    }

    .popup-footer {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      /* A tight, symmetric block inset — the buttons carry their own padding,
         so the footer only has to separate them from the calendar above and
         the card edge below, not pad them a second time. The last date row
         still clears the buttons by more than this alone: the picker's own
         bottom inset (.popup-card ui-date-picker above) sits on top of it.
         Bottom used to be --ui-spacing-md, four times the top, which left the
         card visibly bottom-heavy. Inline stays -md: it's what keeps Clear and
         OK off the card's rounded corners. */
      padding: var(--ui-spacing-sm) var(--ui-spacing-md);
    }

    /* Pushes Cancel/OK to the trailing edge, leaving Clear on its own at the
       leading edge — it's a destructive action and shouldn't sit next to the
       confirm button where it can be hit by accident. */
    .popup-footer-spacer {
      flex: 1 1 auto;
    }
  `,
];
