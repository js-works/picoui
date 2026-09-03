import { css } from "lit";

import { defaultTheme } from "../theme/theme.js";

export const optionStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: block;
      font-family: var(--ui-font-sans);
      font-size: inherit;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    /* Lets an owner (combobox filtering by typed text) hide a non-matching
       option via the plain hidden attribute — :host's display: block above is
       an author style and would otherwise win over the UA [hidden] rule. */
    :host([hidden]) {
      display: none;
    }

    .option {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-md);
      box-sizing: border-box;
      padding-block: calc(5px * var(--ui-scale));
      padding-inline: var(--ui-spacing-md);
      /* Transparent by default (not only on [active]) so activating the row
         doesn't change its size or shift layout. The inline-start edge is
         permanently wider — that's the accent bar the active row colours in,
         and being part of the border it follows border-radius cleanly. */
      border: var(--ui-border-thin) solid transparent;
      border-inline-start-width: calc(4px * var(--ui-scale));
      border-radius: var(--ui-radius-sm);
      color: var(--ui-text);
      cursor: pointer;
    }

    :host([disabled]) .option {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option:hover {
      background: var(--ui-color-primary-50);
    }

    /* Selected rows are marked by the checkbox/tick alone — no row fill, so a
       long list of picks doesn't turn into a wall of colour. */

    /* Keyboard/pointer-highlighted — distinct from [selected], which marks the
       actual current value. A hairline accent outline with a heavier
       inline-start bar over an accent wash, so it reads as "the cursor is
       here". */
    :host([active]) .option {
      border-color: var(--ui-color-primary-500);
      background: var(--ui-color-primary-50);
    }

    /* Fixed-size leading slot, always reserved so labels line up. Single-select:
       a bare checkmark shown only when selected. */
    .check {
      flex: none;
      width: 1.15em;
      height: 1.15em;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ui-color-primary-500);
    }

    .check svg {
      width: 1em;
      height: 1em;
    }

    /* Multi-select: the slot becomes an always-visible checkbox square —
       hollow when unpicked, filled accent with a white tick when picked. */
    :host([multiple]) .check {
      border: var(--ui-border-thin) solid var(--ui-color-neutral-400);
      border-radius: var(--ui-radius-xs);
      color: var(--ui-color-on-accent);
    }

    :host([multiple][selected]) .check {
      background: var(--ui-color-primary-500);
      border-color: var(--ui-color-primary-500);
    }

    :host([multiple][selected]) .check svg {
      width: 0.85em;
      height: 0.85em;
    }

    .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
];
