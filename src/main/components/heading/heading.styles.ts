import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const headingStyles = [
  defaultTheme,
  css`
    /* Block, not the button/text default of inline(-flex) — a heading reads
       as its own line unless a caller explicitly overrides \`display\` (e.g.
       to sit inline next to a badge). */
    :host {
      display: block;
      font-family: var(--ui-font-sans);
      font-weight: var(--ui-font-weight-bold);
      color: var(--ui-text);
      margin: 0;
    }

    /* One dedicated 6-step scale (not the 3-step small/medium/large
       \`size\` override below) — \`level\` alone already gives a heading its
       default visual weight, the same way a real \`<h1>\`…\`<h6>\` would via
       the UA stylesheet, without a caller needing to also set \`size\`. Levels
       5/6 land at the body/small text sizes on purpose (a real \`<h6>\` reads
       barely bigger than body text too) — \`font-weight: bold\` above is what
       still marks them as headings rather than plain text. */
    :host([level="1"]) {
      font-size: calc(2.25rem * var(--ui-scale));
    }

    :host([level="2"]) {
      font-size: calc(1.75rem * var(--ui-scale));
    }

    :host([level="3"]) {
      font-size: var(--ui-font-size-xl);
    }

    :host([level="4"]) {
      font-size: calc(1.25rem * var(--ui-scale));
    }

    :host([level="5"]) {
      font-size: var(--ui-font-size-md);
    }

    :host([level="6"]) {
      font-size: var(--ui-font-size-sm);
    }

    /* \`size\`, when set, overrides whatever \`level\` above resolved to — the
       same 3-step scale (and the same tokens) every other sizable component
       in this library uses, so "small" here means the same physical size as
       \`ui-button\`'s or \`ui-text-field\`'s own \`size="small"\`. */
    :host([size="small"]) {
      font-size: var(--ui-font-size-sm);
    }

    :host([size="medium"]) {
      font-size: var(--ui-font-size-md);
    }

    :host([size="large"]) {
      font-size: var(--ui-font-size-lg);
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

    /* A single line, ellipsized rather than wrapping — applied to \`:host\`
       itself (not a wrapper element inside the shadow root): a bare
       \`<slot>\` generates no box of its own, so the host's own box is what
       slotted text actually overflows out of. \`::slotted()\` wouldn't reach
       a plain slotted text node (the common case, e.g.
       \`<ui-heading>Title</ui-heading>\`) at all — it only ever matches
       slotted *elements*. */
    :host([truncate]) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
];
