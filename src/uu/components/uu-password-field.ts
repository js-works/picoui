import { html, css } from "lit";
import { customElement } from "lit/decorators.js";

import { TextFieldElement } from "../base/text-field-element.js";
import { fieldStyles } from "../base/field.styles.js";
import { lengthValidity, renderNativeInput } from "../base/field-helpers.js";
import type { FieldConfig } from "../base/field-element.js";
import { eyeIcon, eyeSlashIcon } from "../icons/icons.js";

/**
 * A themed `<input type="password">` with a show/hide toggle inside the field
 * border. `required` / `minlength` / `maxlength` are checked here (the native
 * password input does none of it); there is no `pattern` — a password policy
 * is better expressed as help text than a single opaque regex.
 *
 * Whether the value is currently revealed is deliberately not part of the
 * element's API — transient presentational state with no form semantics, held
 * in a constructor-local closure the field config reads and writes, so it
 * never lands on the instance surface.
 */
@customElement("uu-password-field")
export class PasswordField extends TextFieldElement {
  static styles = [
    ...fieldStyles,
    css`
      .toggle {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-inline: 0.25rem var(--field-padding);
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1em;
      }

      .toggle:disabled {
        cursor: default;
        opacity: 0.5;
      }
    `,
  ];

  constructor() {
    // Per-instance private state — a plain lexical binding (not `this`, so it
    // is legal before super()); each instance's config closures capture their
    // own.
    let revealed = false;

    const config: FieldConfig<PasswordField> = {
      controlSelector: "input",
      computeValidity: (host) => lengthValidity(host),
      renderControl: (host, ids) => html`
        ${renderNativeInput(host, ids, {
          type: revealed ? "text" : "password",
        })}
        <button
          type="button"
          class="toggle"
          aria-label=${revealed ? "Hide password" : "Show password"}
          aria-pressed=${revealed}
          ?disabled=${host.disabled}
          @click=${() => {
            if (host.disabled) return;
            revealed = !revealed;
            host.requestUpdate();
          }}
        >
          ${revealed ? eyeSlashIcon : eyeIcon}
        </button>
      `,
    };

    super(config);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uu-password-field": PasswordField;
  }
}
