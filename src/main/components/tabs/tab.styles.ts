import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const tabStyles = [
  defaultTheme,
  css`
    /* The host itself is the tab — role="tab"/tabindex/aria-selected are set
       directly on it (see tab.ts), so it's the actual interactive/focusable
       node rather than something inside a shadow-DOM wrapper. That keeps
       aria-controls/aria-labelledby (set by the owning ui-tabs, pairing
       this with its ui-tab-panel) plain same-light-tree id references,
       rather than needing to cross a shadow boundary. */
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      font-weight: var(--ui-font-weight-normal);
      font-family: var(--ui-font-sans);
      font-size: inherit;
      color: var(--ui-color-neutral-600);
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-md);
      /* Reserved transparent (not omitted) so becoming [selected] is a pure
         color change, never a layout shift from the border's own space. */
      border-bottom: var(--ui-border-thick) solid transparent;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition:
        color 120ms ease,
        background-color 120ms ease,
        border-color 120ms ease;
    }

    :host([orientation="vertical"]) {
      border-bottom: none;
      /* A little taller than the horizontal case's --ui-spacing-sm. A
         vertical tab is a full-width strip whose hover/selected background
         spans the whole tablist, so the same 4px that looks right on a
         content-width horizontal tab reads as cramped here. No shared token
         for it — the scale jumps straight from -sm (4px) to -md (16px), and
         16px is far too much — so this scales off --ui-scale directly, the
         same way the one-off border widths elsewhere do. */
      padding-block: calc(6px * var(--ui-scale));
      /* inline-end, not -start: matches the tablist's own border-inline-end
         (tabs.styles.ts) that separates it from the panel content — the
         accent sits on the same side as that divider, same as the
         horizontal case where both the tablist's and the tab's own accent
         border are border-bottom. */
      border-inline-end: var(--ui-border-thick) solid transparent;
    }

    /* tab-align only affects vertical tabs — see ui-tabs's own "tabAlign"
       doc comment for why it's a no-op in horizontal (no shared width to
       shift a label within). */
    :host([orientation="vertical"][tab-align="start"]) {
      justify-content: flex-start;
    }

    :host([orientation="vertical"][tab-align="end"]) {
      justify-content: flex-end;
    }

    /* A translucent tint of the text color, not the opaque
       --ui-color-neutral-100 this was: an opaque light gray only reads as
       "tinted" while the surface underneath happens to be --ui-bg's white.
       Put a tablist on any other surface — a card, a panel, a page with its
       own background (the demo's own gray page is exactly this) — and an
       opaque neutral-100 either matches that surface and vanishes, or reads
       as an unrelated color patch. A tint darkens (in dark mode: lightens)
       whatever is actually behind it, so hover/selected stay visible on any
       surface. 4%: over white that composites to #f5f5f5 — the exact shade
       neutral-100 used to paint there, so the light-mode-on-white case this
       was originally tuned for is unchanged — and it still reads on a tinted
       surface (#ebebeb on the demo's own #f5f5f5 page). Dark mode is the
       weakest case at this strength (~#0f0f0f over --ui-bg's #050505, where
       the old opaque neutral-100 was #171717); if it ever reads too faint
       there, the fix is a per-scheme strength via light-dark(), not a single
       higher number that would overpower light mode. */
    :host(:hover:not([disabled])) {
      color: var(--ui-text);
      background: color-mix(in srgb, var(--ui-text) 4%, transparent);
    }

    :host([selected]) {
      color: var(--ui-color-primary-600);
      border-bottom-color: var(--ui-color-primary-500);
      /* Faux-semibold via stacked zero-offset text-shadow rather than an
         actual font-weight bump: real bold glyphs are wider than regular
         ones, so a font-weight increase here would resize the tab (and, in
         vertical mode, every tab sharing the tablist's stretched width —
         see tabs.styles.ts) and shift surrounding content the moment a tab
         is selected. A blurred shadow thickens the glyph strokes without
         touching layout metrics, so it's safe to gate on [selected]. */
      text-shadow:
        0 0 0.5px currentColor,
        0 0 0.5px currentColor;
    }

    :host([orientation="vertical"][selected]) {
      border-inline-end-color: var(--ui-color-primary-500);
      /* Same tint as the hover rule above (deliberately the same strength —
         a selected vertical tab and a hovered one have always shared this
         fill; the accent border and the label color are what tell them
         apart). */
      background: color-mix(in srgb, var(--ui-text) 4%, transparent);
    }

    :host([disabled]) {
      color: var(--ui-color-neutral-400);
      cursor: not-allowed;
    }

    :host(:focus-visible) {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: calc(-1 * var(--ui-focus-ring-offset));
    }
  `,
];
