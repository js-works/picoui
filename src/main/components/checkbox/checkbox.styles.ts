import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const checkboxStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-flex;
      /* Default (baseline) alignment synthesizes the host's baseline from its
         content, which shifts depending on whether .box has an icon child
         (checked/indeterminate) or is empty — even though the checkbox's own
         rendered size never changes, that baseline shift changes how much
         leading a surrounding inline formatting context (e.g. a table cell's
         line box) reserves, which was inflating/deflating row height on toggle.
         vertical-align: middle sidesteps synthesized-baseline dependence. */
      vertical-align: middle;
      font-family: var(--ui-font-sans);
      font-size: var(--ui-font-size-md);
      color: var(--ui-text);
    }

    .wrapper {
      display: inline-flex;
      align-items: center;
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
      border-radius: var(--ui-radius-xs);
      background: var(--ui-bg);
      /* The check/dash glyph's color (both SVGs draw in currentColor), set
         here rather than on .checked/.indeterminate below so it's already in
         place for the transition — it's only ever visible once one of those
         has filled the box with primary-500. */
      color: var(--ui-color-on-accent);
      transition:
        background-color 120ms ease,
        border-color 120ms ease;
    }

    .box svg {
      width: 0.8em;
      height: 0.8em;
    }

    .box.checked,
    .box.indeterminate {
      background: var(--ui-color-primary-500);
      border-color: var(--ui-color-primary-500);
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
