import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";
import { MENU_CLOSE_MS, MENU_TRANSITION_MS } from "./menu-core.js";

// Shared by ui-menu-button and ui-split-button — appended to each of their
// own `static styles` alongside menu-popup.ts's renderMenuPopup(), which is
// the only thing that ever produces the .menu-popup/.page/... markup these
// rules target.
export const menuPopupStyles = [
  defaultTheme,
  css`
    /* Positioning (position/left/z-index/max-height/display/flex-direction/
       overflow/top or bottom) is set directly as inline styles by
       shared/popup-layout/popup-layout.ts's trackPopupLayout, called with
       matchWidth: false (see menu-button.ts/split-button.ts) since a menu's
       natural width has nothing to do with its trigger's own — this rule
       only adds the visual theming plus the min/max-width band
       trackPopupLayout deliberately leaves alone in that mode. Growing only
       to the right (not flipped for a trigger near the viewport's right
       edge) is a known gap — out of scope for this pass, see matchWidth's
       own doc comment in popup-layout.ts. */
    .menu-popup {
      min-width: 12rem;
      max-width: 22rem;
      background: var(--ui-bg);
      color: var(--ui-text);
      border: var(--ui-border-thin) solid var(--ui-popup-border-color);
      border-radius: var(--ui-radius-sm);
      box-shadow: var(--ui-popup-shadow);
      transform-origin: top left;
      /* Plays once whenever this stops matching [hidden] — a CSS animation
         restarts any time its own applicability flips from "not matching"
         to "matching" — no JS needed to retrigger this on every open. */
      animation: menu-pop-in ${MENU_CLOSE_MS}ms ease;
    }

    /* Neutralizes the UA stylesheet's own popover defaults, same reasoning
       as ui-select's identical rule (select.styles.ts) — hands full control
       back to trackPopupLayout's own inline styles. */
    .menu-popup[popover] {
      margin: 0;
      padding: 0;
      width: auto;
      height: auto;
      inset: auto;
    }

    /* #closeMenu (menu-core.ts) keeps open false but visible true (so
       hidden stays off) for MENU_CLOSE_MS after a close — this is what
       actually plays during that window; the forwards fill mode holds the
       faded-out end state for the remainder of it instead of snapping back
       to fully-visible one frame before hidden finally lands. */
    .menu-popup.closing {
      animation: menu-pop-out ${MENU_CLOSE_MS}ms ease forwards;
      pointer-events: none;
    }

    @keyframes menu-pop-in {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
    }

    @keyframes menu-pop-out {
      to {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
    }

    .viewport {
      position: relative;
      overflow: hidden;
    }

    .page {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
    }

    /* The incoming page stays in normal flow (relative, not absolute) so
       its natural size is what sizes .viewport throughout the transition —
       matching what .viewport settles back to once it's the only page left
       (see menu-popup.ts's header comment). Relative (rather than plain
       static) only so it can take a z-index below, without affecting its
       own layout box or contribution to .viewport's auto size. Painted
       above the outgoing page (z-index 2 vs 1) — matches a "new page slides
       in over the old one" reading, not the reverse. Physical translateX,
       not a logical/bidi-aware offset — RTL isn't mirrored here, a known
       gap for this pass. */
    .page-in {
      position: relative;
      z-index: 2;
      transform: translateX(100%);
    }

    .page-in.dir-backward {
      transform: translateX(-100%);
    }

    .page-in.phase-run {
      transform: translateX(0);
      transition: transform ${MENU_TRANSITION_MS}ms ease;
    }

    /* Absolute + inset: 0 against .viewport (position: relative above) —
       taken out of flow entirely so it never affects .viewport's size,
       just overlaid at whatever size .page-in currently dictates while it
       slides away underneath the incoming page. */
    .page-out {
      position: absolute;
      z-index: 1;
      inset: 0;
      transform: translateX(0);
    }

    .page-out.phase-run {
      transition: transform ${MENU_TRANSITION_MS}ms ease;
    }

    .page-out.phase-run:not(.dir-backward) {
      transform: translateX(-100%);
    }

    .page-out.phase-run.dir-backward {
      transform: translateX(100%);
    }

    /* A real <button> now (see menu-popup.ts) — the whole row goes back a
       level, not just the chevron, so the click target isn't a small icon
       lost in the corner. */
    .menu-header {
      all: unset;
      box-sizing: border-box;
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
      flex: none;
      cursor: pointer;
      color: var(--ui-text);
      font: inherit;
      text-align: start;
    }

    .menu-header:hover {
      background: var(--ui-color-neutral-100);
    }

    .menu-back-icon {
      display: flex;
      flex: none;
    }

    .menu-title {
      font-weight: var(--ui-font-weight-semibold);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-list {
      flex: 1;
      min-height: 0;
      margin: 0;
      padding-block: var(--ui-spacing-sm);
      padding-inline: var(--ui-spacing-sm);
      overflow-y: auto;
      box-sizing: border-box;
    }

    /* Mid-transition, .page-out is absolutely positioned with inset: 0
       against .viewport (see .page-out above) — which is sized to
       .page-in's own height, not its own. Going to a shorter page forces
       .page-out shorter than its natural content, and its .menu-list's
       overflow-y: auto above would otherwise respond by growing a real
       scrollbar for those ~200ms even though nothing is actually meant to
       be scrollable there (the outgoing page is inert and about to be
       discarded) — hidden here suppresses that, while .viewport's own
       overflow: hidden already clips the excess regardless. */
    .page-in .menu-list,
    .page-out .menu-list {
      overflow-y: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      padding-block: calc(3px * var(--ui-scale));
      padding-inline-start: calc(var(--ui-spacing-sm) * 2);
      padding-inline-end: var(--ui-spacing-sm);
      /* Transparent by default (rather than only added on .active) so the
         border doesn't change the row's size when it becomes active — same
         reasoning as ui-select's own option rows (option.styles.ts). */
      border: var(--ui-border-thick) solid transparent;
      border-radius: var(--ui-radius-sm);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: background-color 100ms ease, border-color 100ms ease;
    }

    /* Hover is its own rule, decoupled from keyboard navigation — matches
       ui-select, where a mouse resting on one row and a keyboard cursor
       parked on another read as visibly distinct states. */
    .menu-item:hover {
      background: var(--ui-color-neutral-100);
    }

    /* Keyboard-highlighted (see MenuController#setActive/moveActive) — a
       focus-ring-like outline rather than a filled background, so it reads
       as "the cursor is here" without being confused for the hover state.
       Same treatment as ui-select's [active] option. */
    .menu-item.active {
      border-color: var(--ui-color-primary-500);
      background: transparent;
    }

    .menu-item.danger {
      color: var(--ui-color-danger-600);
    }

    .menu-item.danger.active {
      border-color: var(--ui-color-danger-600);
    }

    .menu-item.disabled {
      color: var(--ui-color-neutral-400);
      cursor: not-allowed;
    }

    .menu-item-icon {
      display: flex;
      flex: none;
    }

    .menu-item-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-item-chevron {
      display: flex;
      flex: none;
      opacity: 0.6;
    }

    .menu-separator {
      height: calc(1px * var(--ui-scale));
      margin-block: var(--ui-spacing-sm);
      background: var(--ui-color-neutral-200);
    }
  `,
];
