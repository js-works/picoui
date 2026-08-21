import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const linkStyles = [
  defaultTheme,
  css`
    /* Same look as ui-button's own variant="link" (colored, semibold text,
       no underline/padding/background) — this is that variant's exact color
       recipe, reproduced here rather than shared, since a \`<ui-link>\` isn't
       a \`<ui-button>\` under the hood. inline-flex + vertical-align for the
       same reason as ui-button's own :host (see its own doc): a single
       inline-level child would otherwise sit in an anonymous line box of
       its own, throwing off baseline alignment next to surrounding text.
       font: inherit — unlike ui-heading/ui-text (standalone typographic
       elements that assert their own font), a link is almost always
       embedded *inside* some other text, so its font-family/size should
       blend into that context; only font-weight/color below are the
       deliberate overrides. */
    :host {
      display: inline-flex;
      vertical-align: middle;
      font: inherit;

      /* tone="neutral" (the default) — one ramp step darker than the
         colored tones below, same reason ui-button's own --btn-600/700
         shift up a step for "neutral": its 50/100/200 tints would otherwise
         be too close to plain gray to read as a deliberate accent. */
      --link-500: var(--ui-color-neutral-600);
      --link-600: var(--ui-color-neutral-700);
      --link-700: var(--ui-color-neutral-800);
    }

    :host([tone="primary"]) {
      --link-500: var(--ui-color-primary-500);
      --link-600: var(--ui-color-primary-600);
      --link-700: var(--ui-color-primary-700);
    }

    :host([tone="danger"]) {
      --link-500: var(--ui-color-danger-500);
      --link-600: var(--ui-color-danger-600);
      --link-700: var(--ui-color-danger-700);
    }

    :host([tone="warning"]) {
      --link-500: var(--ui-color-warn-500);
      --link-600: var(--ui-color-warn-600);
      --link-700: var(--ui-color-warn-700);
    }

    :host([tone="success"]) {
      --link-500: var(--ui-color-success-500);
      --link-600: var(--ui-color-success-600);
      --link-700: var(--ui-color-success-700);
    }

    .link {
      font-weight: 600;
      color: var(--link-600);
      /* The UA stylesheet's own default anchor underline — ui-button's
         variant="link" has none of this to override in the first place
         (it's a <button>, never underlined to begin with), so this is the
         one rule here with no button equivalent to mirror. */
      text-decoration: none;
      /* Suppresses the browser's own default (grayish) tap-highlight
         overlay on touch — same reasoning as ui-button's own identical
         rule: this element has no fill of its own for that overlay to
         otherwise show through as. */
      -webkit-tap-highlight-color: transparent;
      transition: color 120ms ease;
    }

    /* Faux-semibold via stacked zero-offset text-shadow rather than a
       font-weight bump on hover: real bold glyphs are wider than regular
       ones, so a font-weight increase here would resize the link (and
       reflow surrounding inline text) the instant it's hovered. A blurred
       shadow thickens the glyph strokes without touching layout metrics —
       same trick as ui-tab's [selected] state (tab.styles.ts). */
    .link:hover {
      color: var(--link-700);
      text-shadow:
        0 0 0.5px currentColor,
        0 0 0.5px currentColor;
    }

    .link:active {
      filter: brightness(0.92);
    }

    /* Same larger offset as ui-button's own variant="link" — a link has no
       padding of its own for a standard-offset ring to sit inside, so it'd
       otherwise cut through the text's own descenders. */
    .link:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--link-500);
      outline-offset: 4px;
    }
  `,
];
