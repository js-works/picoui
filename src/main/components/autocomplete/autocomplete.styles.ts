import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { pillsStyles } from "../../shared/pills/pills.js";
import { fieldLabelStyles } from "../../shared/field-label/field-label.js";

// shared/popup-layout/popup-layout.ts's trackPopupLayout (used by
// autocomplete-core.ts) sets the popup's positioning (position/inset/
// max-height/etc.) directly as inline styles on the element itself — nothing
// to compose in here; this file only owns the popup's visual theming (see
// the .popup rule below).
export const autocompleteStyles = [
  defaultTheme,
  pillsStyles,
  fieldLabelStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      /* inline-flex, not inline-block — still an inline-level box, but a flex
         container too, so the optional .field-label stacks above .wrapper
         (flex-direction: column) instead of sitting beside it. With no
         label, a single flex-column child behaves identically to before. */
      display: inline-flex;
      flex-direction: column;

      /* size="medium" (the default). Padding-block values across all three
         sizes (also small/large below, and ui-select/ui-combobox's own
         copies, kept in sync by hand) are picked to land this control's
         overall height on ui-text-field/ui-number-field/etc.'s own natural
         height at the same size — not a round token, since matching an
         unrelated component's height is the actual goal here, not the
         spacing scale. */
      font-size: var(--ui-font-size-md);
      /* Was 0px (same as small below) at one point — collapsed medium and
         small to the same overall height, which read as broken rather than
         "compact". 2px keeps a real, visible step between the three sizes. */
      --autocomplete-padding-block: calc(2px * var(--ui-scale));
      /* Was a flat var(--ui-spacing-md) (16px) on the <input> directly,
         regardless of size — same ui-select's own padding-inline had before
         it got a small→large progression; matched to that same progression
         here instead. */
      --autocomplete-padding-inline: calc(8px * var(--ui-scale));
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
      --autocomplete-padding-block: 0px;
      --autocomplete-padding-inline: calc(4px * var(--ui-scale));
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
      /* 4px, down from 5px, now that .content's pill-height floor grows with
         this size's own font — same retune as ui-select's copy. */
      --autocomplete-padding-block: calc(4px * var(--ui-scale));
      --autocomplete-padding-inline: calc(12px * var(--ui-scale));
    }

    /* Two columns: .content (pills/input, flex-grow, wraps its own lines
       independently) and .chevron (fixed, pinned to the end) — kept as
       separate flex items of a non-wrapping row so the chevron always stays
       put as its own column, vertically centered, instead of flowing into
       .content's own wrap (which would otherwise drag it down onto a
       trailing line alongside whichever pill last wrapped). */
    .wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      padding-block: var(--autocomplete-padding-block);
      box-sizing: border-box;
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-spacing-sm);
      flex: 1;
      min-width: 0;
      /* Without this, .wrapper's height comes from whichever is taller: the
         plain input, or (once multiple mode has picks) a row of pills — so
         adding the first pill visibly grows the box. Floored to a pill's own
         height instead (shared/pills/pills.ts's .pill: 1px padding-block × 2
         + 1px border × 2, and .pill-remove's 1.4em/line-height:1 as the
         tallest child — same formula as ui-select's own .content, kept in
         sync by hand) so the empty and "has pills" states render the same
         height. em-based (1.4em of the pill's own 0.875em) so the floor scales
         with \`size\` — see ui-select's own copy for the full derivation. */
      min-height: calc(1.4 * 0.875em + var(--ui-spacing-sm));
      /* Breathing room around the pills themselves — .wrapper's own
         padding-block (above) is intentionally near-zero to keep the plain
         (no pills) state compact, so this is the pills' own vertical margin
         from the border, not the whole control's. */
      padding-block: calc(2px * var(--ui-scale));
    }

    .wrapper:has(.pill) {
      padding-inline-start: var(--ui-spacing-sm);
    }

    :host([invalid]) .wrapper {
      border-color: var(--ui-color-danger-500);
    }

    input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      padding-block: 0;
      padding-inline: var(--autocomplete-padding-inline);
      font-family: var(--ui-font-sans);
      font-size: inherit;
      border: none;
      background: transparent;
      color: inherit;
    }

    input::placeholder {
      color: var(--ui-color-neutral-400);
      font-weight: 400;
      font-size: inherit;
    }

    input:focus {
      outline: none;
    }

    /* Once pills are crowding the row, input's own min-width: 0 above (needed
       so it can shrink small enough for .content's wrap to kick in at all)
       would otherwise let it get squeezed down to an unusable sliver — this
       floors it at a still-comfortable typing width instead, wrapping to its
       own line if there isn't room rather than shrinking further. */
    .content:has(.pill) input {
      min-width: 4em;
    }

    .spinner {
      flex: none;
      width: 1em;
      height: 1em;
      box-sizing: border-box;
      border: var(--ui-border-thick) solid color-mix(in srgb, currentColor 20%, transparent);
      border-top: var(--ui-border-thick) solid var(--ui-color-neutral-500);
      border-radius: 50%;
      animation: autocomplete-spin 0.75s linear infinite;
    }

    /* Same toggle-affordance chevron (and open-state rotation) as ui-select's
       trigger. */
    .chevron {
      flex: none;
      display: flex;
      align-items: center;
      margin-inline-end: var(--ui-spacing-md);
      color: var(--ui-text);
      cursor: pointer;
      transition: transform 250ms ease;
    }

    .chevron-open {
      transform: rotate(180deg);
    }

    @keyframes autocomplete-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* The floating popup card — holds the header, the scrollable listbox, the
       loading/no-matches status message, and the footer, in whatever
       combination applies. Header/footer/status live outside .listbox on
       purpose so they never scroll with the rows.

       Positioning mechanics (position/inset/z-index/max-height/the
       flex-column+overflow that lets max-height clip cleanly/top vs bottom
       for placement) are all set as inline styles directly on this element
       by shared/popup-layout/popup-layout.ts's trackPopupLayout (see this
       file's top-of-file comment and that module's header comment for why:
       an earlier pure-CSS anchor-positioning attempt could flip once there
       was literally no room left, but position-try-order: most-height
       (needed to prefer whichever side has more room, not just whichever
       still technically fits) proved unreliable in real-world testing) —
       this rule only adds the visual theming. */
    .popup {
      /* Same reasoning as ui-select's own .popup: a floor independent of
         trackPopupLayout's default trigger-width match, so a deliberately
         narrow trigger doesn't also cramp the listbox itself. */
      min-width: 7em;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-sm);
      box-shadow: var(--ui-popup-shadow);
    }

    .listbox {
      flex: 1;
      min-height: 0;
      margin: 0;
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      list-style: none;
      overflow-y: auto;
      box-sizing: border-box;
    }

    .listbox[hidden] {
      display: none;
    }

    li[role="option"] {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      box-sizing: border-box;
      padding-block: calc(3px * var(--ui-scale));
      padding-inline: var(--ui-spacing-sm);
      /* Transparent by default (rather than only added on .active) so the border
         doesn't change the row's size and shift layout when it becomes active. */
      border: var(--ui-border-thick) solid transparent;
      border-radius: var(--ui-radius-sm);
      cursor: pointer;
    }

    li[role="option"][aria-selected="true"] {
      font-weight: 600;
    }

    li[role="option"]:hover {
      background: var(--ui-color-neutral-100);
    }

    /* Focus-ring-like outline rather than a filled background, so it reads
       as "the cursor is here" without competing with [aria-selected]'s own
       visual weight. Same treatment as ui-select/ui-combobox's own
       ui-option active state (option.styles.ts). */
    li[role="option"].active {
      border-color: var(--ui-color-primary-500);
      background: transparent;
    }

    /* Fixed-width slot, always reserved (even when empty) so option labels line
       up whether or not that row is the selected one — sized to fit the
       1.1em multi-select checked icon (check-square.icon.ts) plus a bit of
       breathing room on each side. */
    .check {
      flex: none;
      width: 1.1em;
      padding-inline: 0.15em;
      box-sizing: content-box;
      display: flex;
      color: var(--ui-color-primary-500);
    }

    .separator {
      padding: var(--ui-spacing-sm) var(--ui-spacing-sm) 0;
      font-size: var(--ui-font-size-sm);
      opacity: 0.6;
    }

    .header,
    .footer {
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      font-size: var(--ui-font-size-sm);
      opacity: 0.7;
    }

    .header {
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .footer {
      border-top: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .status {
      display: flex;
      align-items: center;
      gap: calc(8px * var(--ui-scale));
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      font-size: 1em;
    }
  `,
];
