import { css } from "lit";

import { buttonStyles } from "../button/button.styles.js";
import { menuPopupStyles } from "../../shared/menu/menu-popup.styles.js";

export const menuButtonStyles = [
  ...buttonStyles,
  ...menuPopupStyles,
  css`
    /* Establishes the containing block for the popup's position: absolute,
       sized to the button's own content — not :host itself, which a
       consumer's layout can stretch taller than the button (e.g. a flex
       row's default align-items: stretch) — same trap, and same fix,
       ui-select's own .wrapper works around (see select.styles.ts). */
    .wrapper {
      position: relative;
      display: inline-block;
    }

    .chevron {
      display: flex;
      margin-inline-start: 0.1em;
    }
  `,
];
