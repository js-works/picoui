import { css } from "lit";

import { formControlStyles } from "../base/form-control.styles.js";
import { pillsStyles } from "../shared/pills.js";

export const selectStyles = [
  ...formControlStyles,
  pillsStyles,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: inline-flex;
      flex-direction: column;
      vertical-align: middle;
      font-family: var(--ui-font-sans);

      /* size="medium" (the default). Padding-block values across all three
         sizes are picked to land this control's overall height on the text
         field's own natural height at the same size. */
      font-size: var(--ui-font-size-md);
      --select-padding-block: calc(2px * var(--ui-scale));
      --select-padding-inline: calc(8px * var(--ui-scale));
      /* Overridable by a consumer that needs a narrower trigger. */
      --select-min-width: 12em;
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
      --select-padding-block: 0px;
      --select-padding-inline: calc(4px * var(--ui-scale));
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
      --select-padding-block: calc(4px * var(--ui-scale));
      --select-padding-inline: calc(12px * var(--ui-scale));
    }

    :host([disabled]) {
      cursor: not-allowed;
    }

    /* Establishes the containing block for #popup's position: absolute, sized
       to the trigger's own content — not :host itself, which a consumer's
       layout can stretch taller than the trigger. */
    .wrapper {
      position: relative;
      display: inline-block;
    }

    /* A plain <div role="combobox"> (not a <button>) — a native <button> can't
       contain another interactive <button>, which multiple mode's removable
       pills need. */
    .trigger {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      min-width: var(--select-min-width);
      padding-block: var(--select-padding-block);
      padding-inline-start: var(--select-padding-inline);
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
      font: inherit;
      cursor: pointer;
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

    .trigger:has(.pill) {
      padding-inline-start: var(--ui-spacing-sm);
    }

    .trigger:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([disabled]) .trigger {
      opacity: 0.55;
      cursor: not-allowed;
    }

    :host([invalid]) .trigger {
      border-color: var(--ui-color-danger-500);
    }

    .value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: start;
    }

    .value.placeholder {
      color: var(--ui-color-neutral-400);
      font-weight: 400;
      font-size: inherit;
    }

    .chevron {
      flex: none;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-inline: 0.5em;
      color: var(--ui-text);
    }

    .chevron-icon {
      display: flex;
      transition: transform 250ms ease;
    }

    .chevron-open {
      transform: rotate(180deg);
    }

    /* Positioning is set as inline styles by trackPopupLayout (see the
       component's firstUpdated) — this rule only adds the visual theming. */
    .popup {
      min-width: 7em;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-sm);
      box-shadow: var(--ui-popup-shadow);
    }

    /* Neutralizes the UA popover defaults so trackPopupLayout's inline
       position/left/width/top/bottom win cleanly. */
    .popup[popover] {
      margin: 0;
      padding: 0;
      width: auto;
      height: auto;
      inset: auto;
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

    /* ---- inline mode: always-visible listbox, no trigger/popup ---- */

    :host([inline]) .wrapper {
      display: block;
    }

    :host([inline]) .listbox {
      display: block;
      min-width: var(--select-min-width);
      max-height: var(--select-inline-height, 12em);
      border: var(--ui-border-thin) solid
        var(--select-inline-border-color, var(--ui-field-border-color));
      border-radius: var(--ui-field-radius);
      background: var(--ui-bg);
      color: var(--ui-text);
      box-shadow: var(--select-inline-shadow, none);
    }

    :host([inline]) .listbox:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([inline][disabled]) .listbox {
      opacity: 0.55;
      cursor: not-allowed;
    }

    :host([inline][invalid]) .listbox {
      border-color: var(--ui-color-danger-500);
    }
  `,
];
