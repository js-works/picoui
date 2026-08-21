import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const optionGroupStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: block;
      font-family: var(--ui-font-sans);
    }

    /* Lets an owner (e.g. ui-combobox filtering by typed text) hide a group whose
       options are all filtered out — needed because :host's own display: block
       above is an author style and would otherwise win over the UA stylesheet's
       [hidden] display:none rule regardless of specificity (same reasoning as
       ui-option's own [hidden] rule). */
    :host([hidden]) {
      display: none;
    }

    .group-label {
      padding: var(--ui-spacing-sm) var(--ui-spacing-sm) 0;
      font-size: var(--ui-font-size-sm);
      font-weight: 600;
      opacity: 0.6;
    }
  `,
];
