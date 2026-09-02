import { html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { TextFieldElement } from "../base/text-field-element.js";
import { lengthValidity, renderNativeInput } from "../base/field-helpers.js";
import type { FieldConfig } from "../base/field-element.js";

// Internal wiring — a plain module const, never a class member, so nothing
// here reaches the element's public surface.
const config: FieldConfig<TextField> = {
  controlSelector: "input",
  computeValidity: (host) => lengthValidity(host, { pattern: host.pattern }),
  renderControl: (host, ids) => html`
    <slot name="prefix"></slot>
    ${renderNativeInput(host, ids, { type: host.type, pattern: host.pattern })}
    <slot name="suffix"></slot>
  `,
};

/**
 * A themed single-line text field. `type` passes through to the native
 * `<input>` for the close relatives that need no chrome of their own (tel,
 * url, search); `pattern` adds a client-side format check. `prefix`/`suffix`
 * slots sit inside the field border either side of the input.
 */
@customElement("uu-text-field")
export class TextField extends TextFieldElement {
  @property()
  accessor type: HTMLInputElement["type"] = "text";

  @property()
  accessor pattern = "";

  constructor() {
    super(config);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-text-field": TextField;
  }
}
