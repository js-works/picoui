import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const textStyles = [
  defaultTheme,
  css`
    /* as="span" (the default) — inline, no margin, so dropping one of these
       into a sentence of other content doesn't force a line break or add
       unexpected spacing around it. */
    :host {
      display: inline;
      font-family: var(--ui-font-sans);
      font-weight: var(--ui-font-weight-normal);
      font-size: var(--ui-font-size-md);
      color: var(--ui-text);
    }

    :host([as="p"]),
    :host([as="div"]) {
      display: block;
    }

    /* Only "p" gets paragraph spacing — "div" is the plain block escape
       hatch (e.g. wrapping a multi-line clamp) with no assumption that
       something else follows it needing separating from. */
    :host([as="p"]) {
      margin-block-end: var(--ui-spacing-md);
    }

    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
    }

    :host([size="medium"]) {
      font-size: var(--ui-font-size-md);
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
    }

    :host([weight="semibold"]) {
      font-weight: var(--ui-font-weight-semibold);
    }

    :host([weight="bold"]) {
      font-weight: var(--ui-font-weight-bold);
    }

    :host([tone="primary"]) {
      color: var(--ui-color-primary-600);
    }

    :host([tone="danger"]) {
      color: var(--ui-color-danger-600);
    }

    :host([tone="warning"]) {
      color: var(--ui-color-warn-600);
    }

    :host([tone="success"]) {
      color: var(--ui-color-success-600);
    }

    /* --ui-text at reduced opacity, not a flat gray — tracks whatever the
       base text color already is (including a caller's own dark-mode
       override) rather than a second, independently-maintained color. Wins
       over the tone rules above via source order (muted reads as "this
       tone, just dimmer" — the last thing applied). */
    :host([muted]) {
      color: var(--ui-text);
      opacity: 0.65;
    }

    :host([truncate]) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* -webkit-line-clamp is unprefixed nowhere yet despite the name, but has
       been supported cross-browser (Chromium/Firefox/Safari alike) for
       years — the standard way to ellipsize after a fixed number of lines
       rather than just one. \`--text-clamp-lines\` is set as an inline host
       style in text.ts (there's no way to read an attribute's own value into
       a used CSS value otherwise) — \`[clamp]\`'s presence alone is enough to
       gate this rule, since Lit only reflects the attribute at all when
       \`clamp\` holds a real number (see text.ts). */
    :host([clamp]) {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: var(--text-clamp-lines);
      overflow: hidden;
    }
  `,
];
