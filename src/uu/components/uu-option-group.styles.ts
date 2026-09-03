import { css } from "lit";

import { defaultTheme } from "../theme/theme.js";

export const optionGroupStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: block;
      font-family: var(--ui-font-sans);
    }

    :host([hidden]) {
      display: none;
    }

    /* Match the listbox's own 1px inter-row gap for the options inside a
       group. */
    .group {
      display: flex;
      flex-direction: column;
      gap: calc(1px * var(--ui-scale));
    }

    .group-label {
      padding: var(--ui-spacing-md) var(--ui-spacing-md) var(--ui-spacing-sm);
      font-size: calc(0.75rem * var(--ui-scale));
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ui-color-neutral-500);
    }
  `,
];
