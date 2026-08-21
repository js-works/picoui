import { css } from "lit";

/* prettier-ignore */
// `:root` alongside `:host` is inert wherever this only lives inside a shadow
// root (no shadow root has a root element), but lets a consumer also adopt
// this stylesheet at the top-level document to make these tokens available to
// plain light-DOM markup — see src/demo/demo.ts, which does exactly that so
// the demo page's own chrome tracks the same theme as the components it hosts.
//
// ## Light and dark
//
// Every color token below is a `light-dark()` pair, and the scheme is switched
// through the standard `color-scheme` property — never by overriding a token.
// That is forced by this file's own shape rather than being a style
// preference: this stylesheet is adopted into *every* component's shadow root,
// so the `:host` rule below declares each token directly on each component
// element, and a declaration on the element itself always beats a value
// inherited from an ancestor. A consumer writing `:root { --ui-bg: #111 }`
// would therefore be silently overridden by every component re-pinning its own
// default — the exact trap `--ui-scale` is kept out of the `:host` block to
// avoid (see its own comment at the bottom of this file). `light-dark()`
// sidesteps it by making each declaration self-contained: nothing has to reach
// in from outside, because both schemes' values are already here.
//
// `color-scheme` can be the switch precisely where a custom property can't,
// because it is a real inherited CSS property that this file only ever
// declares on `:root` (bottom of the file, alongside `--ui-scale` and for the
// same reason) — so it is never re-pinned per component and inherits through
// every shadow boundary from the document root. To follow the OS preference,
// do nothing; to force one scheme, set `color-scheme: light` or `dark` on
// `<html>` (src/demo/demo.ts's theme picker does exactly that, via an inline
// style, which outranks the `:root` rule here). A consumer who does *not*
// adopt this stylesheet at the document level leaves `color-scheme` at its
// initial `normal`, under which `light-dark()` resolves to its light argument
// — i.e. exactly the appearance this library had before dark mode existed.
//
// ## How the dark ramps are derived
//
// The dark half of each color ramp is the light ramp reversed end to end:
// each step pairs with the one the same distance from the other end of the
// ramp — 50↔950, 100↔900, 200↔800, 300↔700, 400↔600, and 500 with itself.
// (Positionally, not arithmetically: Tailwind's steps aren't evenly spaced,
// so the pairing follows the 11-entry list, not 950 minus the number.) That
// is what lets every existing component rule keep
// working in both schemes untouched — everywhere a component reads "one step
// up" to mean *more prominent* (a -500 fill hovering to -600, a -100 tint
// deepening to -200), the mirror preserves it, because -600 is darker than
// -500 against white and lighter than -500 against black. The -500 step is its
// own mirror, so accent fills are literally identical in both schemes.
//
// The mirror is not a perfect design job — Tailwind's ramps aren't
// lightness-symmetric, so a few dark accents come out slightly muddier than a
// hand-picked dark palette would be. It is deliberately a mechanical,
// auditable rule (every pair is visible on its own line) rather than a second
// palette to keep in sync.
export const defaultTheme = css`
  :host, :root {
    /* The base surface. Its dark value has to sit just *outside* the neutral
       ramp's own dark end rather than on it, mirroring how white sits just
       outside #fafafa in light: several components paint a subtly raised
       surface on top of this one with --ui-color-neutral-50 (the datagrid's
       header rows, ui-upload's dropzone), and that only reads
       as raised if the two aren't the same color. neutral-50 mirrors to
       #0a0a0a, so this goes one short step past it — matching light's
       #ffffff-over-#fafafa gap almost exactly — instead of landing on it and
       flattening all three. Not pure black, which reads as harsh. */
    --ui-bg: light-dark(#ffffff, #050505);
    /* Not the literal mirror of black (white): full-strength white text on a
       near-black surface haloes, so this takes the conventional step back. */
    --ui-text: light-dark(#000000, #f5f5f5);

    /* The ink for text and icons sitting on a filled *accent* surface — any
       colored ramp's -500 step. Scheme-independent because -500 is the ramp
       midpoint and therefore the one step the mirroring leaves unchanged, so
       a single value stays correct in both. The neutral tone deliberately
       does *not* use this: its filled surfaces are built from -600, which
       does mirror, so its ink has to mirror with it — see button.styles.ts. */
    --ui-color-on-accent: #ffffff;

    /* Color ramps below are the standard Tailwind CSS palette, used verbatim
       (no color-mix generation) — primary=blue, danger=red, warn=amber,
       success=emerald, neutral=neutral. The second argument of each pair is
       the same palette's mirrored step (see the light/dark note above); -500,
       being its own mirror, is written as a plain single value. */

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
    /* rem, not px — these still track the document root's own font-size (a
       user's browser/OS text-size preference) in addition to --ui-scale,
       which is the one place that's actually wanted (see --ui-scale's own
       comment above). */
    --ui-font-size-sm: calc(0.875rem * var(--ui-scale));
    --ui-font-size-md: calc(1rem * var(--ui-scale));
    --ui-font-size-lg: calc(1.125rem * var(--ui-scale));
    --ui-font-size-xl: calc(1.5rem * var(--ui-scale));

    --ui-font-weight-light: 300;
    --ui-font-weight-normal: 400;
    --ui-font-weight-semibold: 600;
    --ui-font-weight-bold: 700;

    /* px, not rem — border/radius/spacing are visual-design decisions the
       library's own --ui-scale should control on its own, independent of a
       user's separate text-size preference (see --ui-scale's own comment
       above; the type scale above is the one place rem is right). */
    --ui-radius-xs: calc(2px * var(--ui-scale));
    --ui-radius-sm: calc(4px * var(--ui-scale));
    --ui-radius-md: calc(6px * var(--ui-scale));
    --ui-radius-lg: calc(12px * var(--ui-scale));

    --ui-button-radius: var(--ui-radius-sm);
    /* Same per-component-family indirection as --ui-button-radius, for
       every input-like field (text/number/password/email/date fields,
       select, combobox, autocomplete) — lets a consumer round (or square
       off) every field control's corners at once without touching
       --ui-radius-sm itself, which other, unrelated things also read. */
    --ui-field-radius: var(--ui-radius-xs);

    /* The border color shared by every input-like field (text/number/
       password/email/date fields, select, combobox, autocomplete — and,
       matching it, their chevron icon where they have one). Deliberately its
       own token rather than a --ui-color-neutral-* ramp step — history:
       #545454 → lightened to #6b6b6b → lightened too far to #999999 →
       darkened back to #808080 → lightened again, in two steps, to this.
       The dark value is *not* the mirror of the light one (which would be
       roughly #6b6b6b's own inverse and far too bright against the near-black
       surface): a field outline only has to separate the control from its
       background, and against #0a0a0a it takes much less lightness to do that
       than it takes darkness against white. Hand-picked accordingly. */
    --ui-field-border-color: light-dark(#949494, #5e5e5e);

    /* The two border weights used throughout: -thin for hairline dividers
       and field/popup outlines, -thick for the reserved-space active/focus
       outline border (ui-select's [active] option, ui-menu-button's
       .menu-item.active — see option.styles.ts/menu-popup.styles.ts). Not a
       larger sm/md/lg scale — audited every border-width literal in
       src/main and only these two values are actually in use as a line
       weight (a few one-off spinner/hit-target borders elsewhere scale
       directly off --ui-scale without going through a shared token, since
       they aren't this kind of border). */
    --ui-border-thin: calc(1px * var(--ui-scale));
    --ui-border-thick: calc(2px * var(--ui-scale));

    /* Shared by every floating popup (ui-select/ui-combobox/ui-autocomplete's
       dropdown, ui-menu-button/ui-split-button's menu, ui-date-field's
       calendar) — these were identical copy-pasted literals across all of
       them before being pulled out here, so a future restyle only needs to
       change it in one place. */
    --ui-popup-border-color: var(--ui-color-neutral-300);
    /* Three layers, each a bit larger/fainter than the last (rather than the
       previous two-layer version's tight negative spreads, which read as a
       harder-edged cutoff) — a softer, more gradual falloff.
       light-dark() sits on each layer's *color* rather than wrapping the
       whole list, because light-dark() is a color function and a shadow list
       is not a color. The dark alphas are ~5x the light ones: a black shadow
       against a near-black surface is nearly invisible at these opacities, so
       dark mode leans on --ui-popup-border-color above to define the popup's
       edge and uses the shadow only for depth underneath it. */
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

  /* Both of these are deliberately *not* inside the shared :host, :root block
     above, and for the same reason: every token there is redeclared on each
     component's own :host, which (a direct declaration always beats
     inheriting from an ancestor, regardless of specificity) would silently
     pin the value back to its own default on every single component, making
     it impossible for a consumer to actually override. Left undeclared on
     :host, neither is ever redeclared inside a component's shadow tree, so
     both genuinely inherit through the shadow boundary from wherever a
     consumer sets them on the real document (:root here only matches the
     top-level <html> — see this file's own :host, :root doc comment above for
     why the demo adopts this stylesheet there too).

     --ui-scale is the density dial every calc() above multiplies by.

     color-scheme is the light/dark switch (see the long note above): declaring
     both keywords means "follow the OS preference", which is what adopting
     this stylesheet at the document level opts into. Override it on <html> to
     force one — \`document.documentElement.style.colorScheme = "dark"\`. It also
     makes UA-rendered chrome (form-control internals, caret, scrollbars, the
     initial canvas) follow along, which is why no component declares it
     locally. */
  :root {
    --ui-scale: 1;
    color-scheme: light dark;
  }
`;
