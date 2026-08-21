import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const radioGroupStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-block;
      font-family: var(--ui-font-sans);
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: var(--ui-spacing-sm);
    }

    :host([orientation="horizontal"]) .group {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ui-spacing-md);
    }
  `,
];
