import { css } from "lit";

/* prettier-ignore */
// The design-token stylesheet adopted into every component's shadow root. A
// self-contained copy so this family has no runtime dependency on anything
// outside src/uu/ — the token names and values match the main library's theme
// so the two render identically when used side by side.
//
// `:root` alongside `:host` is inert while this only lives inside shadow roots
// (no shadow root has a root element), but lets a consumer also adopt this
// stylesheet at the document level to expose the tokens to plain light-DOM
// markup.
//
// ## Light and dark
//
// Every color token is a `light-dark()` pair; the scheme is switched through
// the standard `color-scheme` property, never by overriding a token. That is
// forced by this file's shape: the stylesheet is adopted into every shadow
// root, so the `:host` rule declares each token directly on each component
// element, and a declaration on the element itself always beats a value
// inherited from an ancestor. A consumer writing `:root { --ui-bg: #111 }`
// would be silently overridden by every component re-pinning its own default.
// `light-dark()` sidesteps that by making each declaration self-contained.
// `--ui-scale` and `color-scheme` are the two things kept *out* of `:host`
// (bottom of the file) for the same reason, so they can genuinely inherit
// through the shadow boundary from wherever a consumer sets them.
//
// With `color-scheme: normal` (a consumer that does not adopt this at the
// document level), `light-dark()` resolves to its light argument.
//
// ## How the dark ramps are derived
//
// The dark half of each color ramp is the light ramp reversed end to end:
// 50↔950, 100↔900, 200↔800, 300↔700, 400↔600, and 500 with itself
// (positionally, not arithmetically). That keeps every "one step up means more
// prominent" component rule working in both schemes untouched, since -600 is
// darker than -500 against white and lighter than -500 against black. It is a
// mechanical, auditable rule rather than a hand-tuned second palette.
export const defaultTheme = css`
  :host, :root {
    --ui-bg: light-dark(#ffffff, #050505);
    --ui-text: light-dark(#000000, #f5f5f5);

    /* Ink for text/icons on a filled accent surface (any ramp's -500 step).
       Scheme-independent because -500 is the one step the mirroring leaves
       unchanged. */
    --ui-color-on-accent: #ffffff;

    /* Standard Tailwind CSS palette, used verbatim. The second argument of
       each pair is the same palette's mirrored step; -500, being its own
       mirror, is a plain single value. */

    --ui-color-primary-50: light-dark(#eff6ff, #172554);
    --ui-color-primary-100: light-dark(#dbeafe, #1e3a8a);
    --ui-color-primary-200: light-dark(#bfdbfe, #1e40af);
    --ui-color-primary-300: light-dark(#93c5fd, #1d4ed8);
    --ui-color-primary-400: light-dark(#60a5fa, #2563eb);
    --ui-color-primary-500: #3b82f6;
    --ui-color-primary-600: light-dark(#2563eb, #60a5fa);
    --ui-color-primary-700: light-dark(#1d4ed8, #93c5fd);
    --ui-color-primary-800: light-dark(#1e40af, #bfdbfe);
    --ui-color-primary-900: light-dark(#1e3a8a, #dbeafe);
    --ui-color-primary-950: light-dark(#172554, #eff6ff);

    --ui-color-danger-50: light-dark(#fef2f2, #450a0a);
    --ui-color-danger-100: light-dark(#fee2e2, #7f1d1d);
    --ui-color-danger-200: light-dark(#fecaca, #991b1b);
    --ui-color-danger-300: light-dark(#fca5a5, #b91c1c);
    --ui-color-danger-400: light-dark(#f87171, #dc2626);
    --ui-color-danger-500: #ef4444;
    --ui-color-danger-600: light-dark(#dc2626, #f87171);
    --ui-color-danger-700: light-dark(#b91c1c, #fca5a5);
    --ui-color-danger-800: light-dark(#991b1b, #fecaca);
    --ui-color-danger-900: light-dark(#7f1d1d, #fee2e2);
    --ui-color-danger-950: light-dark(#450a0a, #fef2f2);

    --ui-color-warn-50: light-dark(#fffbeb, #451a03);
    --ui-color-warn-100: light-dark(#fef3c7, #78350f);
    --ui-color-warn-200: light-dark(#fde68a, #92400e);
    --ui-color-warn-300: light-dark(#fcd34d, #b45309);
    --ui-color-warn-400: light-dark(#fbbf24, #d97706);
    --ui-color-warn-500: #f59e0b;
    --ui-color-warn-600: light-dark(#d97706, #fbbf24);
    --ui-color-warn-700: light-dark(#b45309, #fcd34d);
    --ui-color-warn-800: light-dark(#92400e, #fde68a);
    --ui-color-warn-900: light-dark(#78350f, #fef3c7);
    --ui-color-warn-950: light-dark(#451a03, #fffbeb);

    --ui-color-success-50: light-dark(#ecfdf5, #022c22);
    --ui-color-success-100: light-dark(#d1fae5, #064e3b);
    --ui-color-success-200: light-dark(#a7f3d0, #065f46);
    --ui-color-success-300: light-dark(#6ee7b7, #047857);
    --ui-color-success-400: light-dark(#34d399, #059669);
    --ui-color-success-500: #10b981;
    --ui-color-success-600: light-dark(#059669, #34d399);
    --ui-color-success-700: light-dark(#047857, #6ee7b7);
    --ui-color-success-800: light-dark(#065f46, #a7f3d0);
    --ui-color-success-900: light-dark(#064e3b, #d1fae5);
    --ui-color-success-950: light-dark(#022c22, #ecfdf5);

    --ui-color-neutral-50: light-dark(#fafafa, #0a0a0a);
    --ui-color-neutral-100: light-dark(#f5f5f5, #171717);
    --ui-color-neutral-200: light-dark(#e5e5e5, #262626);
    --ui-color-neutral-300: light-dark(#d4d4d4, #404040);
    --ui-color-neutral-400: light-dark(#a3a3a3, #525252);
    --ui-color-neutral-500: #737373;
    --ui-color-neutral-600: light-dark(#525252, #a3a3a3);
    --ui-color-neutral-700: light-dark(#404040, #d4d4d4);
    --ui-color-neutral-800: light-dark(#262626, #e5e5e5);
    --ui-color-neutral-900: light-dark(#171717, #f5f5f5);
    --ui-color-neutral-950: light-dark(#0a0a0a, #fafafa);

    --ui-font-sans: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    /* rem, not px — the type scale tracks the document root's font-size (a
       user's browser/OS text-size preference) in addition to --ui-scale. */
    --ui-font-size-sm: calc(0.875rem * var(--ui-scale));
    --ui-font-size-md: calc(1rem * var(--ui-scale));
    --ui-font-size-lg: calc(1.125rem * var(--ui-scale));
    --ui-font-size-xl: calc(1.5rem * var(--ui-scale));

    --ui-font-weight-light: 300;
    --ui-font-weight-normal: 400;
    --ui-font-weight-semibold: 600;
    --ui-font-weight-bold: 700;

    /* px, not rem — border/radius/spacing are visual-design decisions
       --ui-scale should control on its own, independent of the text-size
       preference the type scale above already tracks. */
    --ui-radius-xs: calc(2px * var(--ui-scale));
    --ui-radius-sm: calc(4px * var(--ui-scale));
    --ui-radius-md: calc(6px * var(--ui-scale));
    --ui-radius-lg: calc(12px * var(--ui-scale));

    --ui-button-radius: var(--ui-radius-sm);
    /* Per-family indirection for every input-like field control — lets a
       consumer round or square off all field corners at once without touching
       --ui-radius-xs, which unrelated things also read. */
    --ui-field-radius: var(--ui-radius-xs);

    /* The border color shared by every input-like field (and its chevron icon
       where it has one). Deliberately its own token rather than a neutral ramp
       step. The dark value is hand-picked, not the mirror of the light one: an
       outline only has to separate the control from its background, and
       against a near-black surface that takes much less lightness than it
       takes darkness against white. */
    --ui-field-border-color: light-dark(#949494, #5e5e5e);

    /* Two border weights: -thin for hairline dividers and field/popup
       outlines, -thick for the reserved-space active/focus outline border. */
    --ui-border-thin: calc(1px * var(--ui-scale));
    --ui-border-thick: calc(2px * var(--ui-scale));

    /* Shared by every floating popup (dropdowns, menus, calendars). */
    --ui-popup-border-color: var(--ui-color-neutral-300);
    /* Three layers, each larger and fainter than the last, for a gradual
       falloff. light-dark() sits on each layer's color rather than wrapping
       the list, because it is a color function and a shadow list is not a
       color. The dark alphas are ~5x the light ones: a black shadow against a
       near-black surface is nearly invisible at these opacities, so dark mode
       leans on --ui-popup-border-color for the edge and uses the shadow only
       for depth. */
    --ui-popup-shadow:
      0 2px 4px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.44)),
      0 8px 16px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.36)),
      0 20px 32px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));

    --ui-focus-ring-width: var(--ui-border-thick);
    --ui-focus-ring-offset: var(--ui-border-thin);

    --ui-spacing-sm: calc(4px * var(--ui-scale));
    --ui-spacing-md: calc(16px * var(--ui-scale));
    --ui-spacing-lg: calc(24px * var(--ui-scale));
  }

  /* Both are deliberately *not* inside the shared :host, :root block above, and
     for the same reason: every token there is redeclared on each component's
     own :host, which would silently pin the value back to its default on every
     component and make a consumer override impossible. Left undeclared on
     :host, neither is ever redeclared inside a shadow tree, so both genuinely
     inherit through the shadow boundary from wherever a consumer sets them on
     the real document (:root here only matches the top-level <html>).

     --ui-scale is the density dial every calc() above multiplies by.

     color-scheme is the light/dark switch: declaring both keywords means
     "follow the OS preference". Override it on <html> to force one —
     \`document.documentElement.style.colorScheme = "dark"\`. It also makes
     UA-rendered chrome (form-control internals, caret, scrollbars) follow
     along, which is why no component declares it locally. */
  :root {
    --ui-scale: 1;
    color-scheme: light dark;
  }
`;
