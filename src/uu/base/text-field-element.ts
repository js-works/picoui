import { property } from "lit/decorators.js";

import { FieldElement } from "./field-element.js";

/**
 * `FieldElement` plus the surface shared by the single-line free-text fields
 * whose native control does no built-in format check of its own — the text,
 * password and email fields extend this. The number field extends
 * `FieldElement` directly; its numeric props and native range/step validity
 * don't belong here.
 *
 * Abstract — never registered as a custom element itself.
 */
export abstract class TextFieldElement extends FieldElement {
  // The native default ("on") is rarely what a form wants.
  @property()
  accessor autocomplete = "off";

  @property({ type: Number })
  accessor minlength: number | undefined = undefined;

  @property({ type: Number })
  accessor maxlength: number | undefined = undefined;

  #spellcheckDefaulted = false;

  connectedCallback() {
    super.connectedCallback();
    if (!this.#spellcheckDefaulted) {
      this.#spellcheckDefaulted = true;
      // `spellcheck` is a native HTMLElement property (default true); flip the
      // default here rather than in the constructor — setting it there sets
      // the attribute during construction, which violates the custom-element
      // constructor invariants the platform enforces when the element is
      // created from within another element's reaction. Guarded so a later
      // reconnect never clobbers a consumer's explicit override.
      this.spellcheck = false;
    }
  }
}
