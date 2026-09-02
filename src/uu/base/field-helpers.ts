import { html, nothing } from "lit";
import type { TemplateResult } from "lit";

import type { FieldControl, FieldControlIds } from "./field-element.js";
import type { FieldValidity } from "./form-control-core.js";
import type { TextFieldElement } from "./text-field-element.js";

// Validity: delegate to the native control's own ValidityState (used by the
// fields whose `<input type>` already does the check — email, number).
export function nativeValidity(
  _host: unknown,
  control: FieldControl,
): FieldValidity {
  return { flags: control.validity, message: control.validationMessage };
}

// Validity: the hand-rolled required / length / pattern checks shared by the
// plain-text fields (text, password), whose `<input>` type does none of it.
export function lengthValidity(
  host: {
    value: string;
    required: boolean;
    minlength?: number;
    maxlength?: number;
  },
  opts: { pattern?: string } = {},
): FieldValidity {
  const flags: ValidityStateFlags = {};
  let message = "";

  if (host.required && !host.value) {
    flags.valueMissing = true;
    message = "This field is required.";
  }

  if (host.minlength != null && host.value.length < host.minlength) {
    flags.tooShort = true;
    message = `Minimum length is ${host.minlength}.`;
  }

  if (host.maxlength != null && host.value.length > host.maxlength) {
    flags.tooLong = true;
    message = `Maximum length is ${host.maxlength}.`;
  }

  if (
    opts.pattern &&
    host.value &&
    !new RegExp(opts.pattern).test(host.value)
  ) {
    flags.patternMismatch = true;
    message = "Invalid format.";
  }

  return { flags, message };
}

// The common `<input>` for a `TextFieldElement` — every shared attribute bound
// once. `@input`/`@change` are deliberately absent: the base delegates them on
// `.wrapper`.
export function renderNativeInput(
  host: TextFieldElement,
  ids: FieldControlIds,
  opts: { type?: string; pattern?: string } = {},
): TemplateResult {
  return html`
    <input
      id=${ids.control}
      .value=${host.value}
      name=${host.name}
      type=${opts.type ?? "text"}
      placeholder=${host.placeholder}
      autocomplete=${host.autocomplete}
      spellcheck=${host.spellcheck}
      pattern=${opts.pattern || nothing}
      aria-describedby=${ids.describedBy ?? nothing}
      ?disabled=${host.disabled}
      ?required=${host.required}
      ?readonly=${host.readonly}
      minlength=${host.minlength ?? nothing}
      maxlength=${host.maxlength ?? nothing}
    />
  `;
}
