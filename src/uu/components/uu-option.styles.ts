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
      gap: var(--ui-spacing-sm);
      box-sizing: border-box;
      padding-block: calc(3px * var(--ui-scale));
      padding-inline: var(--ui-spacing-sm);
      /* Transparent by default (not only on [active]) so the border doesn't
         change the row's size and shift layout when it becomes active. */
      border: var(--ui-border-thick) solid transparent;
      border-radius: var(--ui-radius-sm);
      color: var(--ui-text);
      cursor: pointer;
    }

    :host([disabled]) .option {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option:hover {
      background: var(--ui-color-neutral-100);
    }

    /* Keyboard-highlighted — distinct from [selected], which marks the actual
       current value. A focus-ring-like outline rather than a filled
       background, so it reads as "the cursor is here". */
    :host([active]) .option {
      border-color: var(--ui-color-primary-500);
      background: transparent;
    }

    :host([selected]) .option {
      font-weight: 600;
    }

    /* Fixed-width slot, always reserved so labels line up — sized for the
       1.1em multi-select checked icon plus breathing room. */
    .check {
      flex: none;
      width: 1.1em;
      padding-inline: 0.15em;
      box-sizing: content-box;
      display: flex;
      color: var(--ui-color-primary-500);
    }

    .label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
];
