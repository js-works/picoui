import { LitElement, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { PropertyValues } from "lit";

import { checkboxStyles } from "./checkbox.styles.js";
import { checkIcon } from "./icons/check.icon.js";
import { dashIcon } from "./icons/dash.icon.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

/**
 * A tri-state checkbox (checked / unchecked / indeterminate), form-associated like
 * the demo's other custom fields. Wraps a real `<input type="checkbox">` — visually
 * hidden but still focusable and keyboard-operable — inside a `<label>`, so the
 * native label-wraps-input association makes the whole row (box + slotted label
 * text) clickable without any click handling of our own; a decorative `.box`
 * sibling (see checkbox.styles.ts) draws the actual checked/indeterminate glyph.
 *
 * Label content is the default slot: `<ui-checkbox name="subscribe">Subscribe to
 * updates</ui-checkbox>`, rather than a separate wrapping `<label>` element the way
 * a plain native checkbox needs — one less thing for a consumer to wire up. The
 * `label` property is a shorthand for the plain-text case that needs no slotted
 * children at all: `<ui-checkbox name="subscribe" label="Subscribe to updates">`.
 */
@customElement("ui-checkbox")
export class Checkbox extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;
  // What `formResetCallback` restores — captured once, from whatever `checked`
  // resolved to (attribute or property) by the first update, matching how a native
  // checkbox's `defaultChecked` freezes at its initial attribute.
  #defaultChecked = false;

  @property()
  accessor name = "";

  // A convenience shorthand for the common plain-text case — equivalent to
  // (and rendered alongside) the default slot the class doc above describes,
  // so `<ui-checkbox label="Subscribe">` works without a light-DOM child.
  // Richer label content (links, formatting) still goes through the slot.
  @property()
  accessor label = "";

  // Matches native `<input type="checkbox">`'s own default `value` of "on" — the
  // value submitted when checked; unchecked never submits anything, same as native.
  @property()
  accessor value = "on";

  @property({ type: Boolean })
  accessor checked = false;

  @property({ type: Boolean })
  accessor indeterminate = false;

  @property({ type: Boolean })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support. Unlike every other control wired up through this
    // helper, a checkbox's label click *toggles* it rather than only focusing
    // it — that's what a native <input type="checkbox"> does — so the click is
    // forwarded to the real inner input instead. That gets the state change,
    // the change/input events and the focus in one step, all through the same
    // path a direct click on the box takes, rather than reimplementing the
    // toggle here.
    //
    // Note ui-checkbox's own `label` property is the usual way to label one
    // (it renders a real <label> inside the shadow root, wrapping the input);
    // this is for the case where the label lives outside the component.
    // Focus first, then click: a programmatic click() toggles the input and
    // fires its events but does not move focus, which a real label click on a
    // native checkbox does (verified — without the focus() the box toggled with
    // no focus ring anywhere).
    focusOnLabelClick(this, () => {
      this.focus({ focusVisible: true });
      this.#input?.click();
    });
  }

  static styles = checkboxStyles;

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;
    this.#defaultChecked = this.checked;
    this.#syncFormValue();
    this.#syncValidity();
  }

  protected updated(changed: PropertyValues<this>) {
    if (changed.has("checked") || changed.has("disabled")) {
      this.#syncFormValue();
    }
    if (changed.has("required") || changed.has("checked")) {
      this.#syncValidity();
    }
  }

  #syncFormValue() {
    this.#internals.setFormValue(
      this.disabled ? null : this.checked ? this.value : null,
    );
  }

  #syncValidity() {
    if (!this.#input) return;

    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && !this.checked) {
      flags.valueMissing = true;
      message = "This field is required.";
    }

    this.#internals.setValidity(flags, message, this.#input);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  #onChange(event: Event) {
    const input = event.target as HTMLInputElement;

    this.checked = input.checked;
    // Clicking a checkbox always clears indeterminate natively, before this
    // handler runs — mirror that onto our own tracked property so the next
    // render's `.indeterminate=` binding doesn't stomp the native state back to
    // stale `true`.
    this.indeterminate = input.indeterminate;

    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  formResetCallback() {
    this.checked = this.#defaultChecked;
    if (this.#input) {
      this.#input.checked = this.#defaultChecked;
    }
    this.#syncFormValue();
    this.#syncValidity();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    const isChecked = typeof state === "string";
    this.checked = isChecked;
    if (this.#input) {
      this.#input.checked = isChecked;
    }
    this.#syncFormValue();
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    if (message) {
      this.#internals.setValidity({ customError: true }, message, this.#input);
    } else {
      this.#syncValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  render() {
    // No `<span class="label">` at all — not just an empty one — when
    // there's no label text and nothing slotted: `.wrapper`'s flex `gap`
    // reserves space for every flex item regardless of whether it has any
    // visible content, so an empty label span was leaving a dead strip to
    // the right of the box (most visible when a bare `<ui-checkbox>` with no
    // label is centered in a narrow container, e.g. a datagrid's selection
    // column).
    const hasLabel = this.label !== "" || this.textContent!.trim() !== "";

    return html`
      <label class="wrapper">
        <input
          type="checkbox"
          class="native"
          name=${this.name}
          .checked=${this.checked}
          .indeterminate=${this.indeterminate}
          ?disabled=${this.disabled}
          ?required=${this.required}
          @change=${this.#onChange}
        />
        <span
          class="box ${this.indeterminate
            ? "indeterminate"
            : this.checked
              ? "checked"
              : ""}"
        >
          ${this.indeterminate ? dashIcon : this.checked ? checkIcon : nothing}
        </span>
        ${hasLabel
          ? html`<span class="label">${this.label}<slot></slot></span>`
          : nothing}
      </label>
    `;
  }
}
