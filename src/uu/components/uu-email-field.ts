import { html, css } from "lit";
import { customElement } from "lit/decorators.js";

import { TextFieldElement } from "../base/text-field-element.js";
import { fieldStyles } from "../base/field.styles.js";
import { nativeValidity, renderNativeInput } from "../base/field-helpers.js";
import type { FieldConfig } from "../base/field-element.js";
import { emailIcon } from "../icons/icons.js";

const config: FieldConfig<EmailField> = {
  controlSelector: "input",
  computeValidity: nativeValidity,
  renderControl: (host, ids) => html`
    ${renderNativeInput(host, ids, { type: "email" })}
    <span class="icon">${emailIcon}</span>
  `,
};

/**
 * A themed `<input type="email">` — the email-format check (`typeMismatch`)
 * comes straight from the native input's own ValidityState rather than a
 * hand-rolled regex. A trailing envelope icon sits inside the field border.
 */
@customElement("uu-email-field")
export class EmailField extends TextFieldElement {
  static styles = [
    ...fieldStyles,
    css`
      .icon {
        flex: none;
        display: flex;
        align-items: center;
        padding-inline-end: 0.5rem;
        color: var(--ui-color-neutral-700);
      }
    `,
  ];

  constructor() {
    super(config);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-email-field": EmailField;
  }
}
