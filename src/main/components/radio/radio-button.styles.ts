import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const radioButtonStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-flex;
      /* Same synthesized-baseline dependence as ui-checkbox — see its own
         :host comment for the full explanation. */
      vertical-align: middle;
      font-family: var(--ui-font-sans);
      font-size: var(--ui-font-size-md);
      color: var(--ui-text);
    }

    .wrapper {
      display: inline-flex;
      align-items: center;
      /* Same gap as ui-checkbox's label spacing. */
      gap: calc(var(--ui-spacing-sm) * 2);
      cursor: pointer;
    }

    :host([disabled]) .wrapper {
      cursor: default;
      opacity: 0.5;
    }

    /* Visually hidden but still focusable/keyboard-operable — the real toggle
       target. Clicking anywhere in .wrapper reaches it via native label-wraps-input
       association, so the decorative .box below never needs its own click handler. */
    .native {
      position: absolute;
      width: 0;
      height: 0;
      margin: 0;
      opacity: 0;
    }

    .box {
      flex: none;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.1em;
      height: 1.1em;
      border: var(--ui-border-thin) solid var(--ui-color-neutral-600);
      border-radius: 50%;
      background: var(--ui-bg);
      transition: border-color 120ms ease;
    }

    .dot {
      width: 0.55em;
      height: 0.55em;
      border-radius: 50%;
      background: var(--ui-color-primary-500);
      transform: scale(0);
      transition:
        transform 120ms ease,
        background-color 120ms ease;
    }

    :host([checked]) .box {
      border-color: var(--ui-color-primary-500);
    }

    :host([checked]) .dot {
      transform: scale(1);
    }

    :host([invalid]) .box {
      border-color: var(--ui-color-danger-500);
    }

    .native:focus-visible ~ .box {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    .label {
      line-height: 1.4;
    }
  `,
];
