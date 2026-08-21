import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import {
  renderFieldLabel,
  fieldLabelStyles,
} from "../../shared/field-label/field-label.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

/**
 * A multi-line text field wrapping a native `<textarea>` — form-associated
 * (`ElementInternals`) the same way as `ui-text-field`, and sharing that
 * component's label/size/validity conventions (see its own doc comments for
 * the reasoning this mirrors).
 *
 * Two things a plain `<textarea>` doesn't give you for free:
 * - `resize` is exposed as an attribute (`"none" | "vertical" | "horizontal" |
 *   "both"`, default `"vertical"` — the platform's own default) rather than
 *   left to a consumer's own CSS, so it composes with `size` the same way
 *   everything else here does.
 * - `autosize` (opt-in, default off) grows the box to fit its content as the
 *   user types instead of scrolling internally — `rows` still sets the
 *   starting/minimum height. Unbounded by default; a consumer that wants a
 *   cap sets `--ui-textarea-max-height` (see styles below), no JS needed.
 *
 * Deliberately *not* included: `cols` (native character-cell sizing fights
 * with CSS width the way every other field here is sized) and prefix/suffix
 * slots (not a textarea affordance in practice — icons next to multi-line
 * text read oddly).
 */
@customElement("ui-textarea")
export class Textarea extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #textarea!: HTMLTextAreaElement;

  @property()
  accessor name = "";

  // Renders as a real <label for="textarea"> above the field when set — its
  // own accessible name and click-to-focus, no ARIA wiring needed on our part.
  @property()
  accessor label = "";

  @property()
  accessor value = "";

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ type: Boolean })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  @property({ type: Boolean })
  accessor readonly = false;

  @property({ type: Number })
  accessor minlength: number | undefined = undefined;

  @property({ type: Number })
  accessor maxlength: number | undefined = undefined;

  @property()
  accessor placeholder = "";

  // Default to "off": autocomplete's native default ("on") is rarely what a
  // form actually wants — same reasoning as ui-text-field's own default.
  @property()
  accessor autocomplete = "off";

  // Starting height in text rows — stays the *minimum* height once
  // `autosize` is on, rather than being ignored.
  @property({ type: Number })
  accessor rows = 4;

  @property()
  accessor wrap: "soft" | "hard" = "soft";

  @property({ reflect: true })
  accessor resize: "none" | "vertical" | "horizontal" | "both" = "vertical";

  // Grows to fit content instead of scrolling internally — see the class's
  // own doc comment. Forces `resize` off while active (see #syncAutosize
  // and the styles below): letting someone drag-resize a box whose height
  // JS is also actively rewriting on every keystroke fights itself.
  @property({ type: Boolean, reflect: true })
  accessor autosize = false;

  // Unlike ui-text-field, left at the platform default (spellcheck on) —
  // multi-line free text (comments, descriptions) is exactly the case
  // spellcheck exists for, unlike the short identifiers/codes text-field is
  // more often used for.

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  static styles = [
    defaultTheme,
    fieldLabelStyles,
    css`
      :host {
        font-weight: var(--ui-font-weight-normal);
        display: flex;
        flex-direction: column;

        /* size="medium" (the default) — same tokens/steps as
           ui-text-field/ui-number-field/etc., so "small"/"medium"/"large"
           mean the same rendered size everywhere. */
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
        box-sizing: border-box;
        border: var(--ui-border-thin) solid var(--ui-field-border-color);
        border-radius: var(--ui-field-radius);
        background: var(--ui-bg);
      }

      :host([invalid]) .wrapper {
        border-color: var(--ui-color-danger-500);
      }

      .wrapper:focus-within {
        outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
        outline-offset: var(--ui-focus-ring-offset);
      }

      textarea {
        flex-grow: 1;
        min-width: 0;
        font-family: var(--ui-font-sans);
        font-size: var(--field-font-size);
        line-height: 1.4;
        padding: var(--field-padding);
        border: none;
        border-radius: inherit;
        background: transparent;
        color: inherit;
        /* Overridable per instance/consumer — unset (the default) leaves
           autosize's own growth uncapped. */
        max-height: var(--ui-textarea-max-height, none);
      }

      textarea::placeholder {
        color: var(--ui-color-neutral-400);
        font-weight: 400;
        font-size: var(--field-font-size);
      }

      textarea:focus {
        outline: none;
      }

      :host([resize="none"]) textarea {
        resize: none;
      }

      :host([resize="vertical"]) textarea {
        resize: vertical;
      }

      :host([resize="horizontal"]) textarea {
        resize: horizontal;
      }

      :host([resize="both"]) textarea {
        resize: both;
      }

      /* Wins over the resize="..." rules above regardless of source order —
         see #onInput/#autoGrow: while autosize is on, JS is the one driving
         height, so a user-draggable resize handle (which only changes CSS
         height, not the rows/scrollHeight math #autoGrow reads) would just
         get silently overwritten on the next keystroke anyway. */
      :host([autosize]) textarea {
        resize: none;
        overflow-y: hidden;
      }
    `,
  ];

  protected firstUpdated() {
    this.#textarea = this.renderRoot.querySelector("textarea")!;
    this.#syncFormValue();
    this.#syncValidity();
    this.#autoGrow();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("value") || changed.has("disabled")) {
      this.#syncFormValue();
    }

    if (
      changed.has("required") ||
      changed.has("minlength") ||
      changed.has("maxlength")
    ) {
      this.#syncValidity();
    }

    if (changed.has("value") || changed.has("autosize") || changed.has("rows")) {
      this.#autoGrow();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(this.disabled ? null : this.value);
  }

  #syncValidity() {
    if (!this.#textarea) return;

    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && !this.value) {
      flags.valueMissing = true;
      message = "This field is required.";
    }

    if (this.minlength !== undefined && this.value.length < this.minlength) {
      flags.tooShort = true;
      message = `Minimum length is ${this.minlength}.`;
    }

    if (this.maxlength !== undefined && this.value.length > this.maxlength) {
      flags.tooLong = true;
      message = `Maximum length is ${this.maxlength}.`;
    }

    this.#internals.setValidity(flags, message, this.#textarea);

    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  // Resets height to "auto" first, not just growing off the previous inline
  // height — the only way to also *shrink* back down when text is deleted,
  // since scrollHeight while a taller height is still applied would just
  // measure that same (now too-tall) height back out.
  #autoGrow() {
    if (!this.autosize || !this.#textarea) return;
    this.#textarea.style.height = "auto";
    this.#textarea.style.height = `${this.#textarea.scrollHeight}px`;
  }

  #onInput(event: Event) {
    const textarea = event.currentTarget as HTMLTextAreaElement;

    this.value = textarea.value;

    this.#syncFormValue();
    this.#syncValidity();
    this.#autoGrow();

    this.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onChange() {
    this.dispatchEvent(
      new Event("change", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  formResetCallback() {
    this.value = "";

    if (this.#textarea) {
      this.#textarea.value = "";
    }

    this.#syncFormValue();
    this.#syncValidity();
    this.#autoGrow();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state === "string") {
      this.value = state;

      if (this.#textarea) {
        this.#textarea.value = state;
      }

      this.#syncFormValue();
    }
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    if (message) {
      this.#internals.setValidity({ customError: true }, message, this.#textarea);
    } else {
      this.#syncValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.#textarea?.focus(options);
  }

  select() {
    this.#textarea?.select();
  }

  render() {
    return html`
      ${renderFieldLabel(this.label, "textarea")}
      <div class="wrapper">
        <textarea
          id="textarea"
          .value=${this.value}
          name=${this.name}
          placeholder=${this.placeholder}
          autocomplete=${this.autocomplete}
          rows=${this.rows}
          wrap=${this.wrap}
          ?disabled=${this.disabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          minlength=${this.minlength ?? ""}
          maxlength=${this.maxlength ?? ""}
          @input=${this.#onInput}
          @change=${this.#onChange}
        ></textarea>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-textarea": Textarea;
  }
}
