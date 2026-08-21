export default /*css*/ `
  .cal-base {
    display: flex;
    flex-direction: column;
    color: var(--cal-color);
    background-color: var(--cal-background-color);
    font-family: var(--cal-font-family);
    font-size: var(--cal-font-size);
    user-select: none;
    min-width: 17.5em;
    min-height: 14.5em;
  }
  
  .cal-base * {
    box-spacing: border-box;
  }

  .cal-view--month .cal-sheet {
    min-height: 10em;
  }

  .cal-view--year .cal-sheet,
  .cal-view--decade .cal-sheet {
    min-height: 7em;
  }

  .cal-view--century .cal-sheet {
    min-height: 10em;
  }

  /* calendar sheet and sheet header */

  .cal-header {
    display: grid;
    grid-template-columns: min-content auto min-content;
    align-items: stretch;
    color: var(--cal-nav-color);
    /* --cal-header-background-color, which is what this is for. It used to read
       --cal-nav-active-background-color — the tint a nav arrow takes while
       being pressed — so the resting header was permanently painted in it, and
       --cal-header-background-color was read nowhere at all. */
    background-color: var(--cal-header-background-color);
  }

  .cal-header--accentuated {
    color: var(--cal-header-accentuated-color);
    background-color: var(--cal-header-accentuated-background-color);
  }

  .cal-title:not(.cal-title--disabled),
  .cal-prev:not(.cal-prev--disabled),
  .cal-next:not(.cal-next--disabled) {
    cursor: pointer;
  }

  /* The picker's usual radius, so the hover and pressed fills below read as
     rounded chips like everything else here rather than square blocks. Set
     unconditionally rather than inside :hover — a radius with no background is
     invisible, and this way it covers the pressed state too, including the
     touch and keyboard cases where :active fires without :hover.
     Only the non-accentuated header: there the fills sit on a plain background,
     whereas an accentuated header is itself a filled bar edge to edge. */
  .cal-header:not(.cal-header--accentuated)
    > :where(
      .cal-title:not(.cal-title--disabled),
      .cal-prev:not(.cal-prev--disabled),
      .cal-next:not(.cal-next--disabled)
    ) {
    border-radius: var(--cal-button-border-radius);
  }

  .cal-header:not(.cal-header--accentuated)
    > :where(
      .cal-title:not(.cal-title--disabled),
      .cal-prev:not(.cal-prev--disabled),
      .cal-next:not(.cal-next--disabled)
    ):hover {
    color: var(--cal-header-hover-color);
    background-color: var(--cal-header-hover-background-color);
  }
  
  .cal-header:not(.cal-header--accentuated)
    > :where(
      .cal-title:not(.cal-title--disabled),
      .cal-prev:not(.cal-prev--disabled),
      .cal-next:not(.cal-next--disabled)
    ):active {
    color: var(--cal-header-active-color);
    background-color: var(--cal-header-active-background-color);
  }


  .cal-header--accentuated
    > :where(
      .cal-title:not(.cal-title--disabled),
      .cal-prev:not(.cal-prev--disabled),
      .cal-next:not(.cal-next--disabled)
    ):hover {
    color: var(--cal-header-accentuated-hover-color);
    background-color: var(--cal-header-accentuated-hover-background-color);
  }

  .cal-header--accentuated
    > :where(
      .cal-title:not(.cal-title--disabled),
      .cal-prev:not(.cal-prev--disabled),
      .cal-next:not(.cal-next--disabled)
    ):active {
    color: var(--cal-header-accentuated-active-color);
    background-color: var(--cal-header-accentuated-active-background-color);
  }

  .cal-title {
    text-align: center;
    text-transform: capitalize;
  }

  .cal-title,
  .cal-prev,
  .cal-next {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.15em 0.5em;
  }

  .cal-prev--disabled,
  .cal-next--disabled {
    visibility: hidden;
  }

  .cal-sheet {
    display: grid;
    grid-template-rows: auto;
    align-items: stretch;
    flex-grow: 1;
  }

  .cal-column-name {
    text-align: center;
    padding: 0.3em 0.25em;
    font-size: 90%;
    text-transform: capitalize;
  }

  .cal-column-name--highlighted {
    background-color: var(--cal-cell-highlighted-background-color);
  }

  .cal-row-name {
    align-self: center;
    text-align: center;
    min-width: 2em;
    font-size: 75%;
    padding: 0.125em;
  }

  .cal-cell--highlighted {
    background-color: var(--cal-cell-highlighted-background-color);
  }

  .cal-cell {
    /* The four corner radii, as custom properties rather than applied here.
       Custom properties cascade independently of whichever rule ends up reading
       them, which is what lets .cal-cell--joined-* below zero a corner without
       having to out-specify the selected / in-range / :hover rules that apply
       it — those three have wildly different specificities, and the :hover one
       is the highest. Setting them on .cal-cell itself (rather than applying a
       radius here) also keeps the weekend column band square: it paints a
       background but never reads these. */
    --cal-cell-radius-start-start: var(--cal-button-border-radius);
    --cal-cell-radius-start-end: var(--cal-button-border-radius);
    --cal-cell-radius-end-start: var(--cal-button-border-radius);
    --cal-cell-radius-end-end: var(--cal-button-border-radius);
    /* Positioning context for the fill layer below. */
    position: relative;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    justify-items: stretch;
    padding: 0.1em 0.45em;
    text-transform: capitalize;
    hyphens: auto;
  }

  /* Rounded to match the selected cell below — the two sit directly against
     each other in the grid, so a square hover next to a rounded selection reads
     as two different shape languages. The weekend and selection-range tints are
     deliberately left square: those are column and row *bands*, not cells, and
     the range already rounds its own outer ends. */
  .cal-cell:not(.cal-cell--disabled):not(.cal-cell--selected):hover {
    color: var(--cal-cell-hover-color);
  }

  .cal-cell:not(.cal-cell--disabled):not(.cal-cell--selected):hover::before {
    background-color: var(--cal-cell-hover-background-color);
  }

  /* The selection/hover fill is painted by this layer rather than by the cell's
     own background, because the two need different shapes: the weekend column
     tint is a full-bleed square that must run edge to edge, while the fill is a
     rounded chip. One element can't do both — border-radius clips every one of
     an element's background layers identically — so the tint stays on the cell
     and the fill sits on top of it here.
     Before this, a filled cell in a weekend column simply replaced the grey with
     blue, and the rounded corners then showed whatever was behind the cell: the
     card's white, not the column's grey.
     Inherits the corner properties from the cell, so it rounds and joins
     exactly as the joined-edge rules dictate. */
  .cal-cell::before {
    content: '';
    position: absolute;
    inset: 0;
    border-start-start-radius: var(--cal-cell-radius-start-start);
    border-start-end-radius: var(--cal-cell-radius-start-end);
    border-end-start-radius: var(--cal-cell-radius-end-start);
    border-end-end-radius: var(--cal-cell-radius-end-end);
  }

  /* Above the fill layer. Both are positioned with z-index auto, so paint order
     is DOM order and ::before comes first — but the text needs a position for
     that to apply to it at all. */
  .cal-cell-text {
    position: relative;
  }

  .cal-cell:not(.cal-cell--disabled) {
    cursor: pointer;
  }

  .cal-cell--selected:not(.cal-cell--disabled) {
    color: var(--cal-cell-selected-color);
  }

  .cal-cell--selected:not(.cal-cell--disabled)::before {
    background-color: var(--cal-cell-selected-background-color);
  }

  .cal-cell--selected:not(.cal-cell--disabled):hover::before {
    background-color: var(--cal-cell-selected-hover-background-color);
  }

  .cal-cell--disabled {
    cursor: not-allowed;
    color: var(--cal-cell-disabled-color);
  }

  .cal-cell--disabled.cal-cell--adjacent > .cal-cell-text {
    opacity: 10%;
  }

  .cal-cell--adjacent:not(.cal-cell--disabled):not(.cal-cell--selected) {
    color: var(--cal-cell-adjacent-color);
  }

  .cal-cell--adjacent.cal-cell--disabled {
    color: var(--cal-cell-adjacent-disable-color);
  }

  .cal-cell--current {
    font-weight: 600;
  }
  
  .cal-cell--current:not(.cal-cell--selected):not(.cal-cell--disabled) {
    color: var(--cal-cell-current-highlighted-color, inherit);
  }

  /* Ink follows the fill, not the cell's other roles. Anything wearing the light
     fill — selection range, the range being proposed, or hover — takes the dark
     text colour, and anything wearing the dark fill takes the light one (see
     .cal-cell--selected above, which is now the only rule that colours a
     selected cell).
     Without this, an adjacent-month day kept its muted grey and today's date
     kept its accent blue while sitting on a light blue fill, and a *selected*
     adjacent day was painted near-black on the dark blue fill.
     Four selector units deep so these outrank the adjacent and current rules
     above, which are three, rather than depending on source order to break a
     tie. Disabled cells are deliberately excluded: their low contrast is what
     marks them unavailable, and a disabled day can legitimately sit inside a
     range (disable-weekends plus a range spanning a weekend). */
  .cal-cell.cal-cell--in-selection-range:not(.cal-cell--selected):not(.cal-cell--disabled),
  .cal-cell.cal-cell--in-pending-range:not(.cal-cell--selected):not(.cal-cell--disabled),
  .cal-cell:not(.cal-cell--selected):not(.cal-cell--disabled):hover {
    color: var(--cal-cell-hover-color);
  }

  .cal-cell--in-selection-range:not(.cal-cell--selected)::before,
  .cal-cell--in-pending-range:not(.cal-cell--selected)::before {
    background-color: var(--cal-cell-selection-range-background-color);
  }

  /* Where a filled cell touches another one, the shared edge is squared off, so
     a run of them reads as a single region instead of a row of rounded tiles
     with notches between them. Both axes: horizontally along a week, and
     vertically between the same weekday in consecutive weeks. Applies to every
     fill — selected, selection range, and hover.
     These only set the corner variables; the rules that read them are above.
     Logical corners (start-start = top-left in LTR, top-right in RTL) so this
     holds in an RTL sheet, where the previous item in reading order sits to the
     visual right. */
  .cal-cell--joined-inline-start {
    --cal-cell-radius-start-start: 0;
    --cal-cell-radius-end-start: 0;
  }

  .cal-cell--joined-inline-end {
    --cal-cell-radius-start-end: 0;
    --cal-cell-radius-end-end: 0;
  }

  .cal-cell--joined-block-start {
    --cal-cell-radius-start-start: 0;
    --cal-cell-radius-start-end: 0;
  }

  .cal-cell--joined-block-end {
    --cal-cell-radius-end-start: 0;
    --cal-cell-radius-end-end: 0;
  }

  /* time links */

  .cal-time-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 0 1.5em;
    min-height: 1.6em;
    box-sizing: border-box;
    margin: 0.25em;
    gap: 0 2em;
    white-space: nowrap;
  }

  /* A link, not a button: no fill of its own, and no border-radius since
     there's no fill to round. The padding stays — it's the click target, and
     an invisible one is still worth having. */
  .cal-time-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    text-align: center;
    justify-self: center;
    padding: 0.25em 0.75em;
  }

  .cal-time-link--disabled {
    pointer-events: none;
  }

  /* time view */

  .cal-view--time1,
  .cal-view--time2 {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.25em 0.5em;
    /* .cal-base's min-height is a floor for the *calendar* sheets, so a short
       one (year, decade) can't collapse the picker. The time views have their
       own intrinsic height and don't need it — left applied it padded them out
       with dead space under the wheels. */
    min-height: auto;
  }

  /* time */

  .cal-time {
    margin: 0;
  }

  .cal-time-header {
    font-size: calc(100% - 1px);
    margin-bottom: 0.1em;
    font-weight: 200;
  }

  .cal-time-value {
    font-size: 120%;
  }

  /* time tabs */

  .cal-time-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .cal-time-tabs > .cal-time {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    white-space: nowrap;
  }

  .cal-time-tabs > .cal-time:only-child {
    text-align: center;
    grid-column: span 2;
  }

  .cal-time-tabs--active-tab-time1 > .cal-time:first-child,
  .cal-time-tabs--active-tab-time2 > .cal-time:nth-child(2) {
    pointer-events: none;
  }

  /* Hovering the *inactive* From:/To: tab — the one you can switch to. A plain
     neutral tint rather than an accent one: it means "this is interactive", the
     same signal ui-button's outlined variant, ui-tab and ui-select's option rows
     all use, and it shouldn't compete with the accent that marks the selection.
     Fill only — the tab's border is deliberately left alone. It used to be
     repainted in the fill colour, which erased the divider between the two tabs
     for as long as the pointer was over one and made the pair's outline flicker
     on hover. */
  .cal-time-tabs--active-tab-time1 > .cal-time:nth-child(2):hover,
  .cal-time-tabs--active-tab-time2 > .cal-time:first-child:hover {
    cursor: pointer;
    background-color: var(--cal-tab-hover-background-color);
  }

  .cal-time-tabs--active-tab-time1 > .cal-time:nth-child(2) {
    font-size: 75%;
    border-width: 0 0 1px 1px;
    border: 0 solid var(--cal-border-color);
    border-width: 0 0 1px 1px;
    white-space: nowrap;
    padding: 0.4em 1em;
  }

  .cal-time-tabs > .cal-time:nth-child(2) {
    padding-left: 1em;
  }

  .cal-time-tabs--active-tab-time1 > .cal-time:first-child:not(:only-child) {
    padding-left: 0.5em;
  }

  .cal-time-tabs--active-tab-time2 > .cal-time:first-child {
    font-size: 75%;
    border: 0 solid var(--cal-border-color);
    border-width: 0 1px 1px 0;
    white-space: nowrap;
    padding: 0.4em 1em;
  }

  /* back to month link */

  /* inline-flex + align-self rather than the filled, full-width block this
     was: without a background, a block would leave the whole row clickable
     including the empty space either side of the text, which a link shouldn't
     be. The parent (.cal-view--time1/2) is a flex column, so align-self
     centres it. */
  .cal-back-to-month-link {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: 0.4em;
    padding: 0.25em 0.75em;
  }

  /* --- the shared link look ------------------------------------------- */

  /* No colour of their own: these inherit the normal text colour from
     .cal-base, so the hover is the only thing that marks them out. No token
     for it either — there is nothing to configure when the resting state is
     just "the text colour". */
  .cal-time-link,
  .cal-back-to-month-link {
    text-decoration: none;
    cursor: pointer;
    /* Suppresses the browser's own grey tap-highlight on touch, which would
       otherwise put back exactly the background these rules remove. */
    -webkit-tap-highlight-color: transparent;
  }

  /* The whole hover effect: faux-semibold via stacked zero-offset text-shadow
     rather than a real font-weight bump, because heavier glyphs are wider and
     a weight change would reflow the text (and, for .cal-time-links, shift the
     two links within their grid). A blurred shadow thickens the strokes
     without touching layout metrics — the same trick ui-link and ui-tab use.
     There is deliberately no colour shift: at the normal text colour there is
     nowhere stronger to go. */
  .cal-time-link:hover,
  .cal-back-to-month-link:hover {
    text-shadow:
      0 0 0.5px currentColor,
      0 0 0.5px currentColor;
  }

  /* time selector — hour/minute option columns, see #renderTimeSelector */

  /* The positioning box. Its only job is where the wheels sit; the row itself
     is .cal-time-wheels below. */
  .cal-time-selector {
    display: flex;
    justify-content: center;

    /* The colon and the AM/PM control line up with the *selected* option, not
       with the top of the columns — the selection always sits at each column's
       vertical middle (#scrollSelectedTimeIntoView keeps it there) and both
       read as part of the current value. That alignment is structural: every
       child of the row is a .cal-time-column-group with an equal-height caption
       on top (empty for those two, see #renderTimeAside) and a column-height box
       below it, so there is no offset to compute. */
    /* 7.5em, not 7: at 7em the 29px options give 3.86 rows, so only three are
       fully visible; 7.5em clears four for 8px more. A wheel showing one option
       either side of the selection is hard to scan. */
    --cal-time-column-height: 7.5em;
    --cal-time-caption-height: 1.25em;
    --cal-time-caption-gap: 0.3em;
  }

  .cal-time-wheels {
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
  }

  /* With both from:/to: tabs showing, the wheels move under whichever tab is
     being edited instead of staying centred, so which half of the range you're
     changing is obvious at a glance.
     from: is exact — 0.5em is the same leading padding
     .cal-time-tabs--active-tab-time1 > .cal-time:first-child gives its label, so
     the wheels start on the label's own left edge.
     to: is right-aligned rather than left-aligned to its label, and that is a
     constraint rather than a preference: the wheel row is ~157px wide while half
     the card's content box is ~147px, so starting it at the to: label would run
     it ~18px past the card — which ui-date-field's popup clips (overflow: hidden
     for the rounded corners). Right-aligning puts it as far under the to: tab as
     actually fits and can never overflow. Making the literal alignment possible
     would need the card around 23em rather than 19.5em. */
  .cal-time-selector--time1 {
    justify-content: flex-start;
  }

  .cal-time-selector--time1 > .cal-time-wheels {
    padding-inline-start: 0.5em;
  }

  .cal-time-selector--time2 {
    justify-content: flex-end;
  }

  /* See #renderTimeSelector: set on the renders where the wheels jump instead
     of gliding, so the selection lands fully painted rather than fading up
     underneath a wheel that has already arrived. */
  .cal-time-selector--instant .cal-time-option {
    transition: none;
  }

  .cal-time-column-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--cal-time-caption-gap);
  }

  .cal-time-column-label {
    height: var(--cal-time-caption-height);
    /* line-height pinned to the same value so the caption box is exactly the
       declared height regardless of the font's own metrics — the offset below
       is derived from it. */
    line-height: var(--cal-time-caption-height);
    text-align: center;
    font-size: 0.8em;
    opacity: 0.65;
  }

  .cal-time-column {
    /* position: relative so the options' offsetTop is measured against this
       box — that is what #scrollSelectedTimeIntoView does its centring maths
       with. */
    position: relative;
    height: var(--cal-time-column-height);
    overflow-y: auto;
    /* Fades the clipped options at both ends rather than cutting them dead,
       so it reads as a list that continues past the frame. */
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      black 1.3em,
      black calc(100% - 1.3em),
      transparent 100%
    );
    scrollbar-width: none;
    /* Half the column's height above and below the options, so the first and
       last entry can still reach the vertical centre. Derived from the height
       rather than written as its own number: any other value both under-serves
       the ends and, unless it happens to land on whole pixels, leaves the
       centring maths a fraction out. */
    padding: calc(var(--cal-time-column-height) / 2) 0;
    box-sizing: border-box;
  }

  /* A looping column needs no end padding: there is always another copy above
     and below, so the first and last value can reach the centre on their own. */
  .cal-time-column--looping {
    padding: 0;
  }

  .cal-time-column::-webkit-scrollbar {
    display: none;
  }

  /* The column is what takes focus (see #renderTimeColumn), so the ring goes
     here rather than on an option. Width and offset are literals: the core has
     no token for them and they're the same 2px/1px the rest of this library
     uses, but the colour is themeable because it has to sit against whatever
     surface the picker is dropped onto. */
  .cal-time-column:focus-visible {
    outline: 2px solid var(--cal-focus-ring-color);
    outline-offset: 1px;
  }

  .cal-time-option {
    display: block;
    padding: 0.15em 0.55em;
    border-radius: var(--cal-button-border-radius);
    text-align: center;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    user-select: none;
    transition:
      background-color 100ms ease,
      color 100ms ease;
  }

  .cal-time-option:hover {
    background-color: var(--cal-cell-hover-background-color);
    color: var(--cal-cell-hover-color);
  }

  .cal-time-option--selected,
  .cal-time-option--selected:hover {
    background-color: var(--cal-cell-selected-background-color);
    color: var(--cal-cell-selected-color);
    font-weight: 600;
  }

  /* The same height as a column, so centring within it lands on the column's
     own centre — which is where the selected option is kept. */
  .cal-time-separator {
    height: var(--cal-time-column-height);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
  }

`;
