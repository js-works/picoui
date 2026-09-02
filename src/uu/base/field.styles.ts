import { css } from "lit";

import { formControlStyles } from "./form-control.styles.js";

// The field-shaped chrome layered on top of `formControlStyles`: the size
// tiers, the label above the control, the bordered `.wrapper` around it, and
// the plain `input` / `textarea` reset. A concrete field spreads this into its
// own `static styles` and appends whatever its adornments need (a stepper, a
// toggle, an icon).
export const fieldStyles = [
  ...formControlStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      font-weight: var(--ui-font-weight-normal);

      /* size="medium" (the default). On :host so slotted adornments, which
         inherit ambient font-size rather than the control's, scale too. */
      font-size: var(--field-font-size);
      --field-font-size: var(--ui-font-size-md);
      --field-padding: 0.4rem;
    }

    :host([size="small"]) {
      --field-font-size: var(--ui-font-size-sm);
      --field-padding: 0.25rem;
    }

    :host([size="large"]) {
      --field-font-size: var(--ui-font-size-lg);
      --field-padding: 0.55rem;
    }

    .wrapper {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      border: var(--ui-border-thin) solid var(--ui-field-border-color);
      border-radius: var(--field-border-radius, var(--ui-field-radius));
      background: var(--ui-bg);
    }

    .wrapper:focus-within {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([invalid]) .wrapper {
      border-color: var(--ui-color-danger-500);
    }

    input,
    textarea {
      flex-grow: 1;
      min-width: 0;
      font-family: var(--ui-font-sans);
      font-size: var(--field-font-size);
      padding: var(--field-padding);
      border: none;
      background: transparent;
      color: inherit;
    }

    input:focus,
    textarea:focus {
      outline: none;
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--ui-color-neutral-400);
      font-weight: 400;
      font-size: var(--field-font-size);
    }

    /* Only styled/spaced when something is actually assigned — an empty slot
       matches no ::slotted rule and contributes no width. */
    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: flex;
      align-items: center;
      flex: none;
      color: var(--ui-color-neutral-700);
    }

    ::slotted([slot="prefix"]) {
      margin-inline-start: 0.5rem;
    }

    ::slotted([slot="suffix"]) {
      margin-inline-end: 0.5rem;
    }
  `,
];
