import { css } from "lit";

import { formControlStyles } from "../base/form-control.styles.js";
import { pillsStyles } from "../shared/pills.js";

export const autocompleteStyles = [
  ...formControlStyles,
  pillsStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-flex;
      flex-direction: column;

      font-size: var(--ui-font-size-md);
      --autocomplete-padding-block: calc(2px * var(--ui-scale));
      --autocomplete-padding-inline: calc(8px * var(--ui-scale));
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
      --autocomplete-padding-block: 0px;
      --autocomplete-padding-inline: calc(4px * var(--ui-scale));
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
      --autocomplete-padding-block: calc(4px * var(--ui-scale));
      --autocomplete-padding-inline: calc(12px * var(--ui-scale));
    }

    .wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      padding-block: var(--autocomplete-padding-block);
      box-sizing: border-box;
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: 0.125em;
      background: var(--ui-bg);
      color: var(--ui-text);
    }

    .wrapper:focus-within {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    .content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-spacing-sm);
      flex: 1;
      min-width: 0;
      min-height: calc(1.4 * 0.875em + var(--ui-spacing-sm));
      padding-block: calc(2px * var(--ui-scale));
    }

    .wrapper:has(.pill) {
      padding-inline-start: var(--ui-spacing-sm);
    }

    :host([invalid]) .wrapper {
      border-color: var(--ui-color-danger-500);
    }

    input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      padding-block: 0;
      padding-inline: var(--autocomplete-padding-inline);
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

    .content:has(.pill) input {
      min-width: 4em;
    }

    .spinner {
      flex: none;
      width: 1em;
      height: 1em;
      box-sizing: border-box;
      border: var(--ui-border-thick) solid
        color-mix(in srgb, currentColor 20%, transparent);
      border-top: var(--ui-border-thick) solid var(--ui-color-neutral-500);
      border-radius: 50%;
      animation: autocomplete-spin 0.75s linear infinite;
    }

    .chevron {
      flex: none;
      align-self: stretch;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline: 0.6em;
      color: var(--ui-color-neutral-600);
      cursor: pointer;
    }

    /* The divider before the chevron — an inset overlay, not a full-height
       border, so it sits a little short of the field's top and bottom. */
    .chevron::before {
      content: "";
      position: absolute;
      inset-inline-start: 0;
      inset-block: 12%;
      width: var(--ui-border-thin);
      background: var(--ui-color-neutral-200);
    }

    .chevron-icon {
      display: flex;
      transition: transform 400ms ease;
    }

    .chevron-icon.chevron-open {
      transform: rotate(180deg);
    }

    @keyframes autocomplete-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Positioning is set as inline styles by trackPopupLayout — this rule only
       adds the visual theming. */
    .popup {
      min-width: 7em;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: 0.125em;
      box-shadow: var(--ui-popup-shadow);
    }

    .listbox {
      flex: 1;
      min-height: 0;
      margin: 0;
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      list-style: none;
      overflow-y: auto;
      box-sizing: border-box;
      /* 1px between every row */
      display: flex;
      flex-direction: column;
      gap: calc(1px * var(--ui-scale));
    }

    .listbox[hidden] {
      display: none;
    }

    li[role="option"] {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-md);
      box-sizing: border-box;
      padding-block: calc(5px * var(--ui-scale));
      padding-inline: var(--ui-spacing-md);
      /* Transparent reserved outline so activating shifts nothing; the wider
         inline-start edge is the accent bar the active row colours in. */
      border: var(--ui-border-thin) solid transparent;
      border-inline-start-width: calc(4px * var(--ui-scale));
      border-radius: var(--ui-radius-sm);
      cursor: pointer;
    }

    /* Selected rows are marked by the checkbox/tick alone — no row fill. */

    li[role="option"]:hover {
      background: var(--ui-color-primary-50);
    }

    li[role="option"].active {
      border-color: var(--ui-color-primary-500);
      background: var(--ui-color-primary-50);
    }

    .check {
      flex: none;
      width: 1.15em;
      height: 1.15em;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ui-color-primary-500);
    }

    .check svg {
      width: 1em;
      height: 1em;
    }

    /* Multi-select: the leading slot becomes an always-visible checkbox square —
       hollow when unpicked, filled accent with a white tick when picked. */
    .listbox[aria-multiselectable="true"] .check {
      border: var(--ui-border-thin) solid var(--ui-color-neutral-400);
      border-radius: var(--ui-radius-xs);
      color: var(--ui-color-on-accent);
    }

    .listbox[aria-multiselectable="true"]
      li[role="option"][aria-selected="true"]
      .check {
      background: var(--ui-color-primary-500);
      border-color: var(--ui-color-primary-500);
    }

    .listbox[aria-multiselectable="true"]
      li[role="option"][aria-selected="true"]
      .check
      svg {
      width: 0.85em;
      height: 0.85em;
    }

    .separator {
      padding: var(--ui-spacing-md) var(--ui-spacing-md) var(--ui-spacing-sm);
      font-size: calc(0.75rem * var(--ui-scale));
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ui-color-neutral-500);
    }

    .header,
    .footer {
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      font-size: var(--ui-font-size-sm);
      opacity: 0.7;
    }

    .header {
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .footer {
      border-top: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .status {
      display: flex;
      align-items: center;
      gap: calc(8px * var(--ui-scale));
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      font-size: 1em;
    }
  `,
];
