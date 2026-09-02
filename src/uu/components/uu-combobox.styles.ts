import { css } from "lit";

import { formControlStyles } from "../base/form-control.styles.js";
import { pillsStyles } from "../shared/pills.js";

export const comboboxStyles = [
  ...formControlStyles,
  pillsStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-flex;
      flex-direction: column;

      /* size="medium" (the default). Padding-block values across all three
         sizes are picked to land this control's overall height on the text
         field's own natural height at the same size. */
      font-size: var(--ui-font-size-md);
      --combobox-padding-block: calc(2px * var(--ui-scale));
      --combobox-padding-inline: calc(8px * var(--ui-scale));
      --combobox-min-width: 12em;
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
      --combobox-padding-block: 0px;
      --combobox-padding-inline: calc(4px * var(--ui-scale));
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
      --combobox-padding-block: calc(4px * var(--ui-scale));
      --combobox-padding-inline: calc(12px * var(--ui-scale));
    }

    :host([disabled]) {
      cursor: not-allowed;
    }

    /* Two columns: .content (pills/input, wraps its own lines) and .chevron
       (fixed, pinned to the end). Establishes the containing block for
       #popup. */
    .wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      min-width: var(--combobox-min-width);
      padding-block: var(--combobox-padding-block);
      box-sizing: border-box;
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-spacing-sm);
      flex: 1;
      min-width: 0;
      /* Floored to a pill's own height so the empty and "has pills" states
         render the same height. */
      min-height: calc(1.4 * 0.875em + var(--ui-spacing-sm));
      padding-block: calc(2px * var(--ui-scale));
    }

    .wrapper:has(.pill) {
      padding-inline-start: var(--ui-spacing-sm);
    }

    :host([disabled]) .wrapper {
      opacity: 0.55;
      cursor: not-allowed;
    }

    :host([invalid]) .wrapper {
      border-color: var(--ui-color-danger-500);
    }

    .wrapper:focus-within {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      padding-block: 0;
      padding-inline: var(--combobox-padding-inline);
      font-family: var(--ui-font-sans);
      font-size: inherit;
      border: none;
      background: transparent;
      color: inherit;
    }

    input::placeholder {
      color: var(--ui-color-neutral-400);
      font-weight: 400;
      font-size: inherit;
    }

    input:focus {
      outline: none;
    }

    /* Floors the input at a comfortable typing width once pills crowd the row,
       wrapping to its own line rather than shrinking to a sliver. */
    .content:has(.pill) input {
      min-width: 4em;
    }

    input:disabled {
      cursor: not-allowed;
    }

    .chevron {
      flex: none;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline: 0.5em;
      color: var(--ui-text);
      cursor: pointer;
    }

    .chevron-icon {
      display: flex;
      transition: transform 250ms ease;
    }

    .chevron-icon.chevron-open {
      transform: rotate(180deg);
    }

    /* Positioning is set as inline styles by trackPopupLayout — this rule only
       adds the visual theming. */
    .popup {
      min-width: 7em;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-sm);
      box-shadow: var(--ui-popup-shadow);
    }

    .listbox {
      flex: 1;
      min-height: 0;
      margin: 0;
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      overflow-y: auto;
      box-sizing: border-box;
    }

    .status {
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      font-size: 1em;
    }
  `,
];
