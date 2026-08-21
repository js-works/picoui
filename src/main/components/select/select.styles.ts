import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { pillsStyles } from "../../shared/pills/pills.js";
import { fieldLabelStyles } from "../../shared/field-label/field-label.js";

export const selectStyles = [
  defaultTheme,
  pillsStyles,
  fieldLabelStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      /* inline-flex, not inline-block — still an inline-level box (so it
         still sits inline with surrounding content the way inline-block did),
         but a flex container too, so the optional .field-label stacks above
         .wrapper (flex-direction: column) instead of sitting beside it. With
         no label, a single flex-column child behaves identically to before. */
      display: inline-flex;
      flex-direction: column;
      vertical-align: middle;
      font-family: var(--ui-font-sans);

      /* size="medium" (the default). Padding-block values across all three
         sizes (also small/large below, and combobox/autocomplete's own
         copies, kept in sync by hand) are picked to land this control's
         overall height on ui-text-field/ui-number-field/etc.'s own natural
         height at the same size — not a round token, since matching an
         unrelated component's height is the actual goal here, not the
         spacing scale. Small lands ~1px over its field counterpart rather
         than exactly on it: .content's pill-height floor below already
         exceeds a small field's height on its own, and padding-block can't
         go below 0 to compensate. */
      font-size: var(--ui-font-size-md);
      /* Was 0px (same as small below) at one point — collapsed medium and
         small to the same overall height, which read as broken rather than
         "compact". 2px keeps a real, visible step between the three sizes. */
      --select-padding-block: calc(2px * var(--ui-scale));
      /* var(--ui-spacing-md) (16px) here previously — a flat, static value
         that didn't scale with size at all (large ended up identical to
         medium) and read as way too wide once padding-block above shrank
         this far. A plain small→large progression instead. */
      --select-padding-inline: calc(8px * var(--ui-scale));
      /* Overridable by a consumer that needs a narrower trigger (e.g. a
         page-size picker). */
      --select-min-width: 12em;
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
      --select-padding-block: 0px;
      --select-padding-inline: calc(4px * var(--ui-scale));
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
      /* 4px, down from 5px, since .content's pill-height floor became
         size-relative (it grows with the font here now, where it used to be
         the same fixed height at every size) — 5px on top of that overshot a
         large field's height by ~1.5px. */
      --select-padding-block: calc(4px * var(--ui-scale));
      --select-padding-inline: calc(12px * var(--ui-scale));
    }

    :host([disabled]) {
      cursor: not-allowed;
    }

    /* Establishes the containing block for #popup's position: absolute,
       sized to the trigger's own content — not :host itself, which a
       consumer's layout can stretch taller than the trigger (e.g. a flex
       row's default align-items: stretch, sizing every item to the tallest
       sibling). Positioning #popup against a stretched :host would still be
       technically "position: relative done right", but "100%" would then
       resolve against that inflated height rather than the trigger's real
       one, leaving a visible gap between the trigger and the popup. */
    .wrapper {
      position: relative;
      display: inline-block;
    }

    /* :host used to be a <button>; it's a plain <div role="combobox"> now
       (see select.ts's render()) — a native <button> can't contain another
       interactive <button>, which multiple mode's removable pills need.

       Two columns: .content (pills/value, flex-grow, wraps its own lines
       independently) and .chevron (fixed, pinned to the end) — kept as
       separate flex items of a non-wrapping row so the chevron always stays
       put as its own column, vertically centered, instead of flowing into
       .content's own wrap (which would otherwise drag it down onto a
       trailing line alongside whichever pill last wrapped). */
    .trigger {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      min-width: var(--select-min-width);
      padding-block: var(--select-padding-block);
      padding-inline-start: var(--select-padding-inline);
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
      font: inherit;
      cursor: pointer;
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-spacing-sm);
      flex: 1;
      min-width: 0;
      /* Without this, .trigger's height comes from whichever is taller: the
         plain value/placeholder text, or (once multiple mode has picks) a row
         of pills — so adding the first pill visibly grows the box. Floored to
         a pill's own height instead (pills.ts's .pill: 1px padding-block × 2
         + 1px border × 2, and .pill-remove's 1.4em/line-height:1 as the
         tallest child) so the empty and "has pills" states render the same
         height.

         em, not the flat --ui-font-size-sm token this was written against:
         1.4em of the pill's own font-size, which is itself 0.875em of this
         control's (see pills.ts), so the floor now scales with \`size\` instead
         of pinning all three sizes to the same height. The +--ui-spacing-sm
         is the px part of the same derivation — the pill's own border+padding
         plus this element's padding-block below, 4px + 4px at scale 1. */
      min-height: calc(1.4 * 0.875em + var(--ui-spacing-sm));
      /* Breathing room around the pills themselves — .trigger's own
         padding-block (above) is intentionally near-zero to keep the plain
         (no pills) state compact, so this is the pills' own vertical margin
         from the border, not the whole control's. */
      padding-block: calc(2px * var(--ui-scale));
    }

    .trigger:has(.pill) {
      padding-inline-start: var(--ui-spacing-sm);
    }

    .trigger:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([disabled]) .trigger {
      opacity: 0.55;
      cursor: not-allowed;
    }

    :host([invalid]) .trigger {
      border-color: var(--ui-color-danger-500);
    }

    .value {
      flex: 1;
      /* A flex item's default min-width is auto (its own content's intrinsic
         width), which overrides overflow/text-overflow below and defeats the
         ellipsis entirely — this is what actually lets it shrink and truncate
         (relevant for both a long single-select label and a long
         multipleValueDisplay: "text" comma list). */
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: start;
    }

    .value.placeholder {
      color: var(--ui-color-neutral-400);
      font-weight: 400;
      font-size: inherit;
    }

    /* Its own padding (rather than .trigger's own padding-inline, which only
       covers the start side now — see .trigger above) so this whole
       stretched box, not just the icon's own tight bounding box, forms a
       comfortably sized visual area — stretch fills the trigger's full
       height, and align-items/justify-content then center the icon inside
       that taller box. Deliberately symmetric on both sides (not matched to
       --select-padding-inline, which differs from this) — an asymmetric
       padding here would put the icon visibly off-center within its own
       box, not just relative to .trigger as a whole. .chevron-icon below is
       a second, tight wrapper sized to exactly the icon and nothing else,
       so rotating it always spins around the icon's own true center
       regardless of whatever padding/stretch this outer box ends up with. */
    .chevron {
      flex: none;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline: 0.5em;
      color: var(--ui-text);
    }

    .chevron-icon {
      display: flex;
      transition: transform 250ms ease;
    }

    .chevron-open {
      transform: rotate(180deg);
    }

    /* Positioning (position/inset/z-index/max-height/display/flex-direction/
       overflow/top or bottom) is set directly as inline styles on this
       element by shared/popup-layout/popup-layout.ts's trackPopupLayout (see
       select.ts's firstUpdated()) — this rule only adds the visual theming. */
    .popup {
      /* trackPopupLayout matches this to the trigger's own width by default
         (matchWidth, see select.ts's firstUpdated()) — a floor independent
         of that so a deliberately narrow trigger (e.g. a page-size picker's
         --select-min-width override) doesn't also cramp the listbox itself,
         where option labels are usually longer than the closed value shown
         on the trigger. */
      min-width: 7em;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-sm);
      box-shadow: var(--ui-popup-shadow);
    }

    /* Neutralizes the UA stylesheet's own popover defaults (margin: auto,
       padding: 0.25em, width/height: fit-content, inset: 0, plus a default
       border/background this rule already overrides above) — an author
       stylesheet rule always wins over UA styles regardless of specificity,
       so this cleanly hands full control back to trackPopupLayout's own
       inline position/left/width/top/bottom styles, same as the plain
       (non-[popover]) case right above needs no such reset at all. */
    .popup[popover] {
      margin: 0;
      padding: 0;
      width: auto;
      height: auto;
      inset: auto;
    }

    .listbox {
      flex: 1;
      min-height: 0;
      margin: 0;
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      overflow-y: auto;
      box-sizing: border-box;
    }

    /* ---- inline mode: always-visible listbox, no trigger/popup ---- */

    :host([inline]) .wrapper {
      display: block;
    }

    :host([inline]) .listbox {
      display: block;
      min-width: var(--select-min-width);
      /* Overridable per use (a caller embedding this inline may want a
         shorter list than this component's own default, and its own
         popup-style border/shadow instead of this plain field-style
         default). */
      max-height: var(--select-inline-height, 12em);
      border: var(--ui-border-thin) solid var(--select-inline-border-color, var(--ui-field-border-color));
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
      box-shadow: var(--select-inline-shadow, none);
    }

    :host([inline]) .listbox:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([inline][disabled]) .listbox {
      opacity: 0.55;
      cursor: not-allowed;
    }

    :host([inline][invalid]) .listbox {
      border-color: var(--ui-color-danger-500);
    }
  `,
];
