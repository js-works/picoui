import { css } from "lit";

import { defaultTheme } from "../theme/theme.js";

// The chrome common to *every* form-associated control, whatever its shape:
// the info/error message row below it, and `:host([hidden])`. Layout (a
// bordered field, an inline checkbox, a fieldset-style group) belongs to the
// layer that owns `render()`, not here.
//
// `defaultTheme` is the library's own token sheet (pure CSS custom
// properties) — imported read-only, nothing in src/main is altered.
export const formControlStyles = [
  defaultTheme,
  css`
    :host([hidden]) {
      display: none;
    }

    .label {
      display: block;
      margin-block-end: var(--ui-spacing-sm);
      font-size: var(--ui-font-size-sm);
      font-weight: 600;
      color: var(--ui-text);
    }

    .message {
      margin-block-start: var(--ui-spacing-sm);
      font-size: var(--ui-font-size-sm);
      line-height: 1.35;
    }

    .message.info {
      color: var(--ui-color-neutral-600);
    }

    .message.error {
      color: var(--ui-color-danger-600);
    }
  `,
];
