import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const buttonStyles = [
  defaultTheme,
  css`
    /* Generic --btn-* tokens carry each tone's color scale; every variant
       rule below reads only these, so adding a variant never means touching the
       per-tone color mapping (and vice versa). tone="neutral" (the
       default) is set directly here rather than behind an attribute selector —
       "define the default, override the rest". */
    :host {
      font-weight: var(--ui-font-weight-normal);
      /* inline-flex, not inline-block: an inline-block's single inline-level
         child (.button, display: inline-flex below) would otherwise sit in
         an anonymous line box of its own, baseline-aligned against a strut
         based on this host's inherited font metrics — leaving an invisible
         gap under the button that throws off vertical centering next to
         sibling elements of a similar height (e.g. the datagrid pagination
         bar's nav buttons next to its page-size/page-input fields). Making
         the host itself a flex container sizes it to exactly wrap .button
         instead, the same way ui-select's :host avoids the same trap. */
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      font-family: var(--ui-font-sans);

      --btn-50: var(--ui-color-neutral-50);
      --btn-100: var(--ui-color-neutral-100);
      --btn-200: var(--ui-color-neutral-200);
      /* light-dark() per step — the one tone that can't just name a ramp
         token, and the only place in this file that reaches for it.

         In light mode these are one step darker than the -600/-700/-800 they
         used to be: the colored tones' solid fill is their ramp's -500 step, a
         real accent, and neutral-600 read washed-out beside them — lighter
         than solid's place in the hierarchy (it is the high-emphasis variant).
         Not darker than -700, though: neutral solid is the secondary action
         standing next to a primary CTA, and past that its contrast against a
         light page overtakes primary-500's, inverting the emphasis order.

         Dark mode deliberately keeps the old -600/-700/-800. Every neutral
         step flips across schemes (a dark gray on white, a light gray on
         black), so a uniform shift toward "darker" reads as *brighter* on a
         dark page — the same one-step move that fixes light mode made the
         neutral solid the loudest thing on the dark page, brighter than the
         primary blue. The two schemes genuinely want opposite steps here,
         which is what a plain var() can't express.

         Each step still keeps the relationships the variants below rely on
         within its own scheme: solid moves by exactly one ramp step on hover
         (-500 → -600), and filled's ink (-700) sits one step past that. The
         light steps (-50/-100/-200, the filled/subtle backgrounds) are the
         same tokens as every tone and need none of this. */
      --btn-500: light-dark(
        var(--ui-color-neutral-700),
        var(--ui-color-neutral-600)
      );
      --btn-600: light-dark(
        var(--ui-color-neutral-800),
        var(--ui-color-neutral-700)
      );
      --btn-700: light-dark(
        var(--ui-color-neutral-900),
        var(--ui-color-neutral-800)
      );
      /* The neutral tone alone can't use --ui-color-on-accent (the flat white
         every colored tone below takes): its solid fill is --btn-500 =
         neutral-700 light / -600 dark, and unlike a colored ramp's
         self-mirroring -500 step
         that one *does* flip across schemes — a dark gray on white, a light
         gray on black — so its ink has to flip with it. neutral-50 is exactly
         that flip (near-white in light, near-black in dark) and is
         indistinguishable from plain white in light mode. */
      --btn-solid-text: var(--ui-color-neutral-50);

      /* size="medium" (the default) — 1em font-size + 0.5em padding on each
         block side adds up to a round 2em button height (line-height: 1 on
         .button below, so the content box is exactly 1em tall). */
      --btn-font-size: var(--ui-font-size-md);
      --btn-padding-block: 0.5em;
      --btn-padding-inline: 0.9em;
      --btn-gap: var(--ui-spacing-sm);
    }

    :host([tone="primary"]) {
      --btn-50: var(--ui-color-primary-50);
      --btn-100: var(--ui-color-primary-100);
      --btn-200: var(--ui-color-primary-200);
      --btn-500: var(--ui-color-primary-500);
      --btn-600: var(--ui-color-primary-600);
      --btn-700: var(--ui-color-primary-700);
      --btn-solid-text: var(--ui-color-on-accent);
    }

    :host([tone="danger"]) {
      --btn-50: var(--ui-color-danger-50);
      --btn-100: var(--ui-color-danger-100);
      --btn-200: var(--ui-color-danger-200);
      --btn-500: var(--ui-color-danger-500);
      --btn-600: var(--ui-color-danger-600);
      --btn-700: var(--ui-color-danger-700);
      --btn-solid-text: var(--ui-color-on-accent);
    }

    :host([tone="warning"]) {
      --btn-50: var(--ui-color-warn-50);
      --btn-100: var(--ui-color-warn-100);
      --btn-200: var(--ui-color-warn-200);
      --btn-500: var(--ui-color-warn-500);
      --btn-600: var(--ui-color-warn-600);
      --btn-700: var(--ui-color-warn-700);
      --btn-solid-text: var(--ui-color-on-accent);
    }

    :host([tone="success"]) {
      --btn-50: var(--ui-color-success-50);
      --btn-100: var(--ui-color-success-100);
      --btn-200: var(--ui-color-success-200);
      --btn-500: var(--ui-color-success-500);
      --btn-600: var(--ui-color-success-600);
      --btn-700: var(--ui-color-success-700);
      --btn-solid-text: var(--ui-color-on-accent);
    }

    :host([size="small"]) {
      --btn-font-size: var(--ui-font-size-sm);
      --btn-padding-block: 0.3em;
      --btn-padding-inline: 0.75em;
      --btn-gap: 0.3em;
    }

    :host([size="large"]) {
      --btn-font-size: var(--ui-font-size-lg);
      --btn-padding-block: 0.65em;
      --btn-padding-inline: 1.25em;
    }

    :host([full-width]) {
      display: block;
    }

    :host([full-width]) .button {
      width: 100%;
    }

    /* all: unset strips the native <button> chrome (UA background/border/font)
       down to a blank slate shared by every variant below. */
    .button {
      all: unset;
      box-sizing: border-box;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--btn-gap);
      font-family: inherit;
      font-size: var(--btn-font-size);
      font-weight: 600;
      line-height: 1;
      padding-block: var(--btn-padding-block);
      padding-inline: var(--btn-padding-inline);
      border: var(--ui-border-thin) solid transparent;
      border-radius: var(--ui-button-radius);
      cursor: pointer;
      user-select: none;
      /* Suppresses the browser's own default (grayish) tap-highlight overlay on
         touch, which otherwise shows through a variant with a transparent base
         background (outlined, subtle, link) and reads as "always just gray"
         regardless of tone — our own :active rules below replace it. */
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color 120ms ease,
        border-color 120ms ease,
        color 120ms ease;

      /* variant="solid" (the default) */
      background: var(--btn-500);
      color: var(--btn-solid-text);
    }

    .button:hover {
      background: var(--btn-600);
    }

    .button:active:not(:disabled) {
      filter: brightness(0.92);
    }

    .button:focus-visible {
      outline: var(--ui-focus-ring-width) solid var(--btn-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    /* loading sets the native disabled attribute too (see button.ts), but stays
       full-strength — only a genuinely disabled, non-loading button fades. */
    .button:disabled {
      cursor: not-allowed;
    }

    .button:disabled:not(.is-loading) {
      opacity: 0.55;
    }

    :host([variant="outlined"]) .button {
      background: transparent;
      border-color: color-mix(in srgb, var(--btn-500) 60%, transparent);
      color: var(--btn-600);
    }

    /* Neutral outlined: a plain gray, matching the neutral hover used
       elsewhere (ui-tab, ui-select's option rows). Neutral has no tone of its
       own to tint with, so this is the one that can't follow the rule below.

       Two selectors because tone is not reflected while it still holds its
       "neutral" default: an untouched button carries no tone attribute at all,
       so [tone="neutral"] alone would miss the common case. */
    :host([variant="outlined"]:not([tone])) .button:hover,
    :host([variant="outlined"][tone="neutral"]) .button:hover {
      background: var(--ui-color-neutral-100);
    }

    /* Toned outlined: the tone's own lightest tint, not the gray above — a
       gray wash over a colored outline fights the tone instead of supporting
       it. --btn-50 for hover and --btn-100 for the press below: the two
       lightest rungs of the ramp, straight from the tokens. */
    :host([variant="outlined"][tone]:not([tone="neutral"])) .button:hover {
      background: var(--btn-50);
    }

    /* An explicit tinted press state — relying only on the generic brightness
       filter (further below) would darken "transparent" itself, which has no
       visible effect, leaving whatever gray default the browser/OS supplies
       (e.g. a touch tap-highlight) as the only feedback. */
    :host([variant="outlined"]) .button:active:not(:disabled) {
      background: var(--btn-100);
    }

    /* Same --btn-100 as the rule above, restated only to outrank the toned
       hover: that selector is (0,6,0) against this one's (0,7,0), and the
       generic press rule is only (0,5,0). Without this, a press — which is
       also a hover — would keep the lighter hover fill and pressed would look
       identical to hovered. */
    :host([variant="outlined"][tone]:not([tone="neutral"]))
      .button:active:not(:disabled) {
      background: var(--btn-100);
    }

    :host([variant="filled"]) .button {
      background: var(--btn-200);
      color: var(--btn-700);
    }

    :host([variant="filled"]) .button:hover {
      background: color-mix(in srgb, var(--btn-500) 25%, var(--btn-200) 75%);
    }

    /* A "ghost" button: colored text, no fill/border until hovered. */
    :host([variant="subtle"]) .button {
      background: transparent;
      color: var(--btn-600);
    }

    :host([variant="subtle"]) .button:hover {
      background: var(--btn-100);
    }

    /* Reads as inline text (no padding/background) rather than a
       button-shaped control. */
    :host([variant="link"]) .button {
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: var(--btn-600);
    }

    /* Faux-bold via stacked zero-offset text-shadow rather than a further
       font-weight bump: a heavier weight than the base 600 would widen the
       glyphs and reflow surrounding inline text the instant this is
       hovered. A blurred shadow thickens the strokes without touching
       layout metrics — same trick as ui-tab's [selected] state
       (tab.styles.ts) and ui-link's own :hover (link.styles.ts). */
    :host([variant="link"]) .button:hover {
      color: var(--btn-700);
      text-shadow:
        0 0 0.5px currentColor,
        0 0 0.5px currentColor;
    }

    :host([variant="link"]) .button:focus-visible {
      outline-offset: 4px;
    }

    /* visibility (not display: none, and not removing the slots) keeps the
       prefix/label/suffix content's layout box reserved so a loading button
       stays exactly the size of its non-loading self — the spinner below is
       then absolutely centered over that reserved space. */
    .button.is-loading > slot {
      visibility: hidden;
    }

    /* Explicit align-self rather than relying only on the container's
       align-items: center — the prefix/suffix slot has display: contents by
       default (its slotted child becomes the real flex item), and a slotted
       icon sitting next to a bare text node (a differently-sized anonymous
       flex item) is worth pinning down directly rather than trusting it falls
       out of the general rule. */
    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      align-self: center;
    }

    /* currentColor tracks whatever text color the active variant/tone
       resolved to, so the spinner never needs its own color token. Centered via
       inset + margin: auto rather than a translate transform — the spin
       animation below already owns the transform property (for its rotate
       keyframes), and an animated transform fully replaces a static one on the
       same property rather than combining with it. */
    .spinner {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 1.2em;
      height: 1.2em;
      box-sizing: border-box;
      border: var(--ui-border-thick) solid color-mix(in srgb, currentColor 25%, transparent);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: ui-button-spin 0.75s linear infinite;
    }

    @keyframes ui-button-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
];
