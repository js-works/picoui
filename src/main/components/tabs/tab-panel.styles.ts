import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const tabPanelStyles = [
  defaultTheme,
  css`
    :host {
      display: block;
      font-weight: var(--ui-font-weight-normal);
      font-family: var(--ui-font-sans);
      font-size: var(--ui-font-size-md);
      color: var(--ui-text);
    }

    /* [hidden] is how the owning ui-tabs hides every panel but the active
       one (see tab-panel.ts) — needed as an explicit override since :host's
       own display: block above is an author style and would otherwise win
       over the UA stylesheet's [hidden] rule regardless of specificity
       (same gotcha ui-option's own :host([hidden]) works around). */
    :host([hidden]) {
      display: none;
    }

    :host(:focus-visible) {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    /* This host has no padding of its own (see :host above) — so without
       this, a plain slotted <p> or heading's own UA-default margin would
       show through as a top/bottom gap indistinguishable from real padding,
       varying by whatever element a caller happens to put first/last.
       Only the outer edges are reset; margins between multiple slotted
       children are left alone. */
    ::slotted(:first-child) {
      margin-block-start: 0;
    }

    ::slotted(:last-child) {
      margin-block-end: 0;
    }
  `,
];
