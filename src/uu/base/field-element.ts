import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import type { TemplateResult } from "lit";

import { fieldStyles } from "./field.styles.js";
import { FormControlElement } from "./form-control-element.js";
import { EMPTY_VALIDITY } from "./form-control-core.js";
import type {
  FormControlHost,
  FormControlRenderApi,
  FieldValidity,
} from "./form-control-core.js";

export type { FieldControl, FieldControlIds, FieldConfig };
export { FieldElement, renderFieldShell };

type FieldControl = HTMLInputElement | HTMLTextAreaElement;

// The ids `renderControl` must wire onto the native control so the shared
// `<label for>` and the `aria-describedby` message association resolve.
interface FieldControlIds {
  control: string;
  describedBy: string | undefined;
}

// What a concrete field declares. `FieldElement`'s constructor adapts it into
// the generic `FormControlConfig` (string value, single native control).
interface FieldConfig<H extends FieldElement = FieldElement> {
  // CSS selector for the native control inside the host's render root.
  controlSelector: string;
  // The entire contents of `.wrapper` — the control plus any adornments (a
  // stepper, a visibility toggle, an icon, prefix/suffix slots).
  renderControl(host: H, ids: FieldControlIds): TemplateResult;
  // Validity flags + message for the current value. Omitted → always valid.
  computeValidity?(host: H, control: FieldControl): FieldValidity;
  // Derive `value` from the control's raw value when they differ (e.g. a date
  // field displaying `T` as a space). Omitted → the raw value verbatim.
  readValue?(host: H, control: FieldControl): string;
}

function resolve(host: FormControlHost, selector: string): FieldControl | null {
  return host.renderRoot.querySelector<FieldControl>(selector);
}

// The field-shaped layout: label above, bordered `.wrapper` around the control
// (with the base's input/change delegation), message row below. Shared by
// every `FieldElement` — a concrete field only fills in `.wrapper`'s contents.
function renderFieldShell(
  host: FieldElement,
  api: FormControlRenderApi,
  renderControl: (host: FieldElement, ids: FieldControlIds) => TemplateResult,
): TemplateResult {
  return html`
    ${
      host.label
        ? html`<label class="label" for=${api.controlId}>${host.label}</label>`
        : nothing
    }
    <div
      class="wrapper"
      part="wrapper"
      @input=${api.onControlInput}
      @change=${api.onControlChange}
    >
      ${renderControl(host, {
        control: api.controlId,
        describedBy: api.describedBy,
      })}
    </div>
    ${api.messages}
  `;
}

/**
 * `FormControlElement` for a control that is a single native `<input>` /
 * `<textarea>` holding a string `value`, drawn as a bordered box with the
 * label above and help/error text below. Base of the text, password, email and
 * number fields.
 *
 * Abstract — never registered as a custom element itself.
 */
abstract class FieldElement extends FormControlElement {
  static readonly styles = fieldStyles;

  @property()
  accessor value = "";

  @property()
  accessor placeholder = "";

  // Value still submits and still validates (unlike `disabled`) — the control
  // just can't be edited. A field with an interactive affordance of its own
  // (the number stepper) also gates that on it.
  @property({ type: Boolean, reflect: true })
  accessor readonly = false;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  readonly #controlSelector: string;

  constructor(config: FieldConfig) {
    super({
      formValue: (host) => (host as FieldElement).value || null,

      computeValidity: (host) => {
        const field = host as FieldElement;
        // disabled/readonly → barred from constraint validation (HTML spec).
        if (field.disabled || field.readonly) return EMPTY_VALIDITY;
        const control = resolve(host, config.controlSelector);
        return control && config.computeValidity
          ? config.computeValidity(field, control)
          : EMPTY_VALIDITY;
      },

      anchor: (host) => resolve(host, config.controlSelector),

      reset: (host) => {
        (host as FieldElement).value = "";
        const control = resolve(host, config.controlSelector);
        if (control) control.value = "";
      },

      restore: (host, state) => {
        if (typeof state !== "string") return;
        (host as FieldElement).value = state;
        const control = resolve(host, config.controlSelector);
        if (control) control.value = state;
      },

      onControlInput: (host) => {
        const control = resolve(host, config.controlSelector);
        if (!control) return;
        (host as FieldElement).value = config.readValue
          ? config.readValue(host as FieldElement, control)
          : control.value;
      },

      render: (host, api) =>
        renderFieldShell(host as FieldElement, api, config.renderControl),
    });

    this.#controlSelector = config.controlSelector;
  }

  focus(options?: FocusOptions) {
    this.renderRoot
      .querySelector<HTMLElement>(this.#controlSelector)
      ?.focus(options);
  }

  select() {
    this.renderRoot
      .querySelector<FieldControl>(this.#controlSelector)
      ?.select?.();
  }
}
