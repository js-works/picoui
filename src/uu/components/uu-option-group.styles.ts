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

    .group-label {
      padding: var(--ui-spacing-sm) var(--ui-spacing-sm) 0;
      font-size: var(--ui-font-size-sm);
      font-weight: 600;
      opacity: 0.6;
    }
  `,
];
