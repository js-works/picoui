import { css } from "lit";

import { buttonStyles } from "../button/button.styles.js";
import { menuPopupStyles } from "../../shared/menu/menu-popup.styles.js";

export const splitButtonStyles = [
  ...buttonStyles,
  ...menuPopupStyles,
  css`
    /* Same containing-block trap/fix as ui-menu-button's own .wrapper (see
       menu-button.styles.ts) — plus the two segments sitting side by side,
       which :host's own display: inline-flex (from buttonStyles) doesn't
       give a dedicated element to anchor the popup against. */
    .wrapper {
      position: relative;
      display: inline-flex;
    }

    /* Sharing one seam: only the two adjoining corners are squared off, so
       the pair still reads as a single pill-shaped control from the
       outside. */
    .segment-primary {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }

    .segment-chevron {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      padding-inline: 0.6em;
      /* currentColor, not a fixed token — .button's own color already
         resolves to whichever the active variant/appearance needs (white
         for solid, --btn-600 for outlined/subtle/link, --btn-700 for
         filled), so this divider reads correctly against all of them
         without a per-variant override. */
      border-inline-start: var(--ui-border-thin) solid color-mix(in srgb, currentColor 30%, transparent);
    }

    /* Outlined is the only variant that paints a real border on both segments
       — every other one leaves .button's base border transparent and lets the
       divider above be the single visible line. Here the primary's inline-end
       and the chevron's inline-start stack at the seam, so the join came out
       2px against 1px everywhere else on the control.

       The fix is to remove one of the two borders outright, and it has to be
       the chevron's: making either one *transparent* instead looks right in
       the middle but bevels at both ends, because adjacent borders mitre at
       45deg. A transparent inline-start against a painted block-start leaves a
       diagonal notch where they meet — a 1px chamfer at the top and bottom of
       the seam, which is exactly the faint 3D bead this used to have. Zero
       width has no edge to mitre, so the primary's block-start border runs
       flat into its inline-end and the line stays square end to end.

       So the seam here is the primary's own inline-end border: full height,
       one pixel, the same colour as the rest of the frame. (The chevron's
       divider colour never applied in this variant anyway —
       :host([variant="outlined"]) .button is (0,3,0) against .segment-chevron's
       (0,1,0) — so nothing tone-specific is lost by dropping it.)

       The padding gives back the pixel the border was occupying, so the
       chevron keeps its width and its glyph stays centred rather than sitting
       1px toward the seam. */
    :host([variant="outlined"]) .segment-chevron {
      border-inline-start-width: 0;
      padding-inline-start: calc(0.6em + var(--ui-border-thin));
    }

    /* No hover/press rules of its own: the outlined hover and press fills now
       live in buttonStyles for every tone, and they apply per .button — which
       here means per segment, so hovering one half tints only that half. That
       is the behaviour a split button needs (it's two hit targets sharing one
       outline, and the fill is the only thing that says which of them the
       pointer is over — the border can't, it's shared, and the label can't,
       only one segment has one), and it now comes for free. */
  `,
];
