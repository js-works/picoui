import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const datagridStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      font-family: var(--ui-font-sans);
      font-size: var(--ui-font-size-sm);
      color: var(--ui-text);
      display: block;
      /* "neutral" (DataGrid.selectionTone's default) — read by every
         selected/hovered-row background rule below, so they all switch
         together. */
      --datagrid-row-accent: var(--ui-color-neutral-500);
    }

    :host([selection-tone="primary"]) {
      --datagrid-row-accent: var(--ui-color-primary-500);
    }

    /* Heading/subheading and the toolbar actions share one row: \`.toolbar\`'s
       \`margin-inline-start: auto\` pushes it to the far end regardless of
       whether \`.header-text\` is present, so actions still end up on the
       right even with no heading/subheading set. */
    .header {
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: var(--ui-spacing-md);
      padding-block: calc(var(--ui-spacing-sm) * 2);
      margin-bottom: var(--ui-spacing-md);
    }

    .heading {
      font-size: var(--ui-font-size-lg);
      font-weight: var(--ui-font-weight-semibold);
      margin: 0;
    }

    .subheading {
      font-size: var(--ui-font-size-sm);
      opacity: 0.7;
      margin: 0.25em 0 0;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      margin-inline-start: auto;
    }

    /* The one border/radius around both the table and the pagination bar
       below it, wrapping the pair as a single card. */
    .grid-panel {
      position: relative;
      border-radius: var(--ui-radius-sm);
      overflow: hidden;
    }

    /* \`.thead\` (header + filter row) deliberately isn't touched by any of
       this — it stays fully opaque and interactive throughout a
       \`dataSource\` request, so sorting/filtering the *next* request stays
       available while the current one is still in flight. Only \`.body\`'s
       own rows (\`.loading-overlay\` is \`.body\`'s *sibling* now, not its
       child — see \`.body-viewport\` below — so it's never matched here and
       stays fully opaque regardless) and \`.pagination-bar\` go transparent
       and (via \`?inert\` in datagrid.ts) non-interactive. */
    .grid-panel.loading .body > *,
    .grid-panel.loading .pagination-bar {
      opacity: 0.25;
    }

    .grid-wrapper {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .table {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    /* border-inline: var(--ui-border-thin) solid transparent (not omitted) on every row type
       — header, filter, and body alike — even though only a selected/
       hovered \`.body-row\`/\`.row-details\` ever colors it in (see below).
       Reserving it everywhere, rather than just there, keeps every row's
       content box (where \`grid-template-columns\` actually distributes its
       tracks) the same width regardless of row type; reserving it on only
       some rows would leave those 2px narrower than the others internally
       even while their own outer widths still matched, throwing columns
       out of alignment between e.g. \`.header-row\` and \`.body-row\`. */
    .row {
      display: grid;
      align-items: stretch;
      border-inline: var(--ui-border-thin) solid transparent;
    }

    /* The base cell rule — kept ahead of \`.header-cell\`/\`.filter-cell\`/
       \`.select-cell\` in source order so those more specific rules (equal
       class-selector specificity) reliably win instead of silently losing
       to whichever one happens to sit later in the file. */
    .cell {
      padding: calc(6px * var(--ui-scale)) var(--ui-spacing-md);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-row {
      flex: none;
      font-weight: var(--ui-font-weight-semibold);
    }

    .header-row .cell {
      position: relative;
    }

    /* Marks the header/filter (or header/body, when there's no filter row)
       boundary — per leaf cell rather than one edge-to-edge border on
       \`.header-row\` itself, so every cell (select/expander gutters, and
       \`.actions-header-cell\` via its own \`.header-cell\` class, included)
       draws its own segment and the line still reads as one continuous span
       across the whole row, with no gaps over the "non-data" columns.
       \`.group-header-cell\` (row 1, spanning several leaf columns) is
       excluded: its own boundary with the leaf headers below it is the
       inset \`::before\` line above, not this one. */
    .header-row .select-cell,
    .header-row .expander-cell,
    .header-row .header-cell:not(.group-header-cell) {
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* Explicitly transparent (not the \`.thead\` neutral-50 tint some other
       header cell might end up with) — the checkbox/expander/actions header
       cells are the three "non-data" columns and stay plain. */
    .header-row .select-cell,
    .header-row .expander-cell,
    .header-row .actions-header-cell {
      background: transparent;
    }

    .header-cell {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      padding: 0.75em var(--ui-spacing-md);
      overflow: hidden;
      user-select: none;
    }

    /* A group's own header, spanning its children's combined width in the
       first header row — left-aligned, same as every other header cell, and
       never sortable (no single field to sort by). The bottom border marks
       the boundary with its children's own row below, the same way
       \`.header-row\`'s own border-bottom marks the boundary with whatever
       comes after the whole header — as a \`::before\` inset from both sides
       (rather than a plain edge-to-edge \`border-bottom\`) so it doesn't run
       flush into the group's own left/right edge. */
    .group-header-cell::before {
      content: "";
      position: absolute;
      inset-inline: 0.5em;
      inset-block-end: 0;
      height: calc(1px * var(--ui-scale));
      background: var(--ui-color-neutral-200);
    }

    .group-header-cell {
      cursor: default;
    }

    .header-cell-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-cell.sortable {
      cursor: pointer;
    }

    .sort-icon {
      flex: none;
      display: flex;
      font-size: 1.6em;
      opacity: 0.6;
    }

    .filter-row {
      flex: none;
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .filter-cell {
      padding: calc(var(--ui-spacing-sm) * 2) var(--ui-spacing-md);
    }

    .filter-cell ui-text-field,
    .filter-cell ui-select {
      width: 100%;
    }

    /* Wraps just \`.body\` (not the whole \`.grid-panel\`, so it never covers
       \`.thead\`) — the positioning anchor for \`.loading-overlay\`, kept as
       \`.body\`'s own *sibling* rather than its child specifically so the
       overlay's \`position: absolute\` is relative to this non-scrolling
       box, not to \`.body\` itself (which scrolls its own descendants,
       \`.loading-overlay\` included, right along with the rows — leaving it
       stuck wherever \`.body\` happened to be scrolled to when loading
       started, rather than centered in the currently visible area). */
    .body-viewport {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    .body {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      scrollbar-gutter: stable;
    }

    /* \`.thead\` never scrolls, so — unlike \`.body\` — it's always exactly
       the container's full width; without a matching reserved gutter, its
       \`grid-template-columns\` (the same fractions as \`.body\`'s own rows)
       would resolve to different actual pixel widths than \`.body\`'s,
       which has that scrollbar's width to spare. \`scrollbar-gutter\` only
       takes effect on an element that's already a scroll container (a
       non-\`visible\` \`overflow\`), hence \`overflow: hidden\` here — harmless,
       since \`.thead\`'s own content never actually overflows it anyway. */
    .thead {
      overflow: hidden;
      scrollbar-gutter: stable;
    }

    .body-row {
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* Zebra striping — opt-in via the \`stripes\` property, off by default.
       Gated on \`:where(:host([stripes]))\`, not plain \`:host([stripes])\` —
       \`:where()\` always contributes zero specificity, so this stays exactly
       as specific as an ungated \`:nth-child(even of .body-row)\` would be
       (one pseudo-class + \`.body-row\`'s own class — "of .body-row", not a
       redundant \`.body-row\` prefix too, which would just add unneeded
       specificity). That keeps it tied with \`.selected\`'s own background
       (one pseudo-class + one class); \`.selected\` is declared later, so it
       still wins the tie on rows where both apply — a plain
       \`:host([stripes])\` ancestor would instead add its own specificity on
       top and incorrectly make the stripe win regardless of source order.
       \`:hover\`'s own background is more specific regardless, via
       \`:host(:is(...))\`. */
    :where(:host([stripes])) :nth-child(even of .body-row) {
      background: var(--ui-color-neutral-50);
    }

    /* A row's own trailing border, not \`.row-details\`'s (added below) — the
       actual last element in \`.body\` is whichever of the two a given row
       ends with, so both are covered here to avoid a doubled line against
       \`.grid-panel\`'s own outer border. */
    .body-row:last-child,
    .row-details:last-child {
      border-bottom: none;
    }

    /* Selected/hovered rows are tinted with --datagrid-row-accent (neutral
       gray by default, primary when \`selectionTone="primary"\` —
       see :host above). */
    .body-row.selected {
      background: color-mix(in srgb, var(--datagrid-row-accent) 12%, var(--ui-bg));
    }

    /* A selected row's left/right edge — unlike the top/bottom edge below,
       always the row's own (\`.row-details\` picks this up too, via its own
       \`.selected\` class, so an expanded panel's sides match its row's). */
    .body-row.selected,
    .row-details.selected {
      border-inline-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    /* A selected row's top/bottom edge, a shade darker than its own
       background tint above — same variable, so it stays in step whether
       \`selectionTone\` is "neutral" or "primary". \`.body-row.selected\`
       covers its own bottom edge; what reads as its *top* edge is really
       the border-bottom of whatever comes immediately before it, so that's
       recolored instead — which one that is depends on whether the row
       above has \`rowDetails\`, and whether that panel is currently expanded
       (an expanded panel's own border-bottom is the real visual boundary;
       collapsed, it has none, so the row above's own border-bottom still
       is). \`.row-details.expanded.selected\` covers the selected row's
       *own* expanded panel, when that panel isn't the boundary for some
       other (differently-selected) row below it — the accented box then
       wraps the whole selected row + its open details as one unit, not
       just the collapsed row itself. */
    .body-row.selected,
    .body-row:has(+ .body-row.selected),
    .body-row:has(+ .row-details:not(.expanded) + .body-row.selected),
    .row-details.expanded:has(+ .body-row.selected),
    .row-details.expanded.selected {
      border-bottom-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    /* \`.thead\`'s own trailing border and \`.pagination-bar\`'s own border-top
       stay plain gray always, regardless of whether the first/last row is
       selected — unlike a row in the middle, the first/last row has no
       neighboring \`.body-row\` border to borrow for its own top/bottom
       edge, so it gets one of its own instead: a reserved (always present,
       just transparent by default) \`border-top\` for the first row, and
       its otherwise-suppressed \`border-bottom\` re-enabled for the last
       row (see \`.row-details.selected:last-child\` further below for why
       that half specifically has to live after \`.row-details.expanded\`'s
       own rule). Scrolled all the way to an edge, this means seeing the
       plain gray \`.thead\`/\`.pagination-bar\` border directly next to this
       accent one — that's the intended look, not a bug. */
    .body-row:first-child {
      border-top: var(--ui-border-thin) solid transparent;
    }

    .body-row:first-child.selected {
      border-top-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    .body-row.selected:last-child {
      border-bottom: var(--ui-border-thin) solid color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    :host([selection-mode="single"]) .body-row,
    :host([selection-mode="multi"]) .body-row {
      cursor: pointer;
    }

    :host([selection-mode="single"]) .body-row:hover,
    :host([selection-mode="multi"]) .body-row:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover) {
      background: color-mix(in srgb, var(--datagrid-row-accent) 6%, var(--ui-bg));
    }

    .body-row.selected:hover {
      background: color-mix(in srgb, var(--datagrid-row-accent) 16%, var(--ui-bg));
    }

    /* Same left/right-edge treatment as \`.body-row.selected\` above, for a
       hovered row — including its own expanded \`row-details\` (no
       \`.selected\` class to key off here, since \`:hover\` has no
       template-time equivalent, so this reaches it via the adjacent-sibling
       combinator instead). The last two selectors are the reverse direction
       — hovering the expanded \`row-details\` panel itself (rather than the
       \`.body-row\` above it) reads as hovering that same row, so it gets
       the identical treatment: the panel colors its own edge directly, and
       \`:has()\` reaches back to color the \`.body-row\` it belongs to (again,
       no template-time link from the details panel back to its row, so
       \`:has()\` stands in for it, same as the forward direction does). */
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      + .row-details.expanded,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .row-details.expanded:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover) {
      border-inline-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    /* Same top/bottom-edge treatment as \`.body-row.selected\` above, for a
       hovered row — same four cases (plain row above, collapsed
       \`rowDetails\` above, expanded \`rowDetails\` above, and the hovered
       row's own expanded panel below it), just keyed off \`:hover\` instead
       and gated by \`selection-mode\` the same way the hover background
       above already is (rows aren't hover-interactive at all otherwise).
       The last two selectors add the reverse direction, same rationale as
       the border-inline rule above: hovering the expanded \`row-details\`
       panel directly colors its own bottom edge, and reaches back via
       \`:has()\` to color the \`.body-row\` it belongs to, so the pair reads
       as one hovered unit regardless of which half the pointer is over. */
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .body-row:hover),
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details:not(.expanded) + .body-row:hover),
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .row-details.expanded:has(+ .body-row:hover),
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      + .row-details.expanded,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .row-details.expanded:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover) {
      border-bottom-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    /* Same first-row/last-row edge treatment as the selected one above, for
       a hovered row — except this only matches a \`.body-row\` that's
       genuinely \`:first-child\`/\`:last-child\` (no trailing \`row-details\`
       case): unlike \`.selected\`, \`:hover\` is a live pseudo-class with no
       template-time equivalent to mirror onto \`row-details\`, so a row
       whose own \`rowDetails\` trails it doesn't get its accent border on
       hover, only on selection. */
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:first-child:hover {
      border-top-color: color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover:last-child {
      border-bottom: var(--ui-border-thin) solid color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    .select-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: 0;
      padding-inline: calc(var(--ui-spacing-sm) / 2);
    }

    .expander-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    /* Transparent (not \`.thead\`'s neutral-50) — these non-data body cells
       let the row's own background (plain, or a selected/hovered row's own
       tint above) show through underneath, same as every other cell in
       the row. */
    .body-row .select-cell,
    .body-row .expander-cell {
      background: transparent;
    }

    /* Same divider look the header already has between its own cells.
       \`.expander-cell\`, when present, always comes right after
       \`.select-cell\` — so it's always the rightmost gutter cell and always
       gets the border; \`.select-cell\` only gets it when there's no
       \`.expander-cell\` right after it to hand the border off to instead
       (both otherwise show doubled, immediately-adjacent borders). */
    .body-row .expander-cell,
    .body-row .select-cell:not(:has(+ .expander-cell)) {
      border-inline-end: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    .row-actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: calc(var(--ui-spacing-sm) * 2 + 0.5em);
    }

    /* Same treatment as the select/expander gutter above, mirrored onto the
       trailing side: transparent, so a selected/hovered row's own tint
       shows through instead, same as every other cell in the row — plus a
       matching divider, on this side a left border, since it's always the
       last cell in the row with nothing after it to hand the border off
       to. */
    .body-row .row-actions-cell {
      background: transparent;
      border-inline-start: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* A selected/hovered row reads as one solid tinted block — its own
       internal column dividers (the select/expander gutter's own divider
       above, and the row-actions gutter's left border above) would cut
       across that and are hidden for the duration. The last three
       selectors cover the reverse-hover case above: the row's own trailing
       expanded \`row-details\` being hovered tints this row's background
       too, so its internal dividers hide right along with it. */
    .body-row.selected .select-cell,
    .body-row.selected .expander-cell,
    .body-row.selected .row-actions-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      .select-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      .expander-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      .row-actions-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover)
      .select-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover)
      .expander-cell,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:has(+ .row-details.expanded:hover)
      .row-actions-cell {
      border-inline-color: transparent;
    }

    /* A plain, unstyled <ui-button variant="link"> (see datagrid.ts) — no
       overrides of its own look here, only the rotation animation: the
       chevron glyph itself never changes, only this button's own rotation
       animates, turning it from pointing right to pointing down (the
       standard disclosure-triangle convention) when expanded. */
    .expander-toggle {
      transition: transform 200ms ease;
    }

    .expander-toggle.expanded {
      transform: rotate(90deg);
    }

    /* A CSS-only expand/collapse animation for content of unknown height:
       a single-row grid track animated between 0fr and 1fr (rather than a
       fixed max-height guess), clipped via the content cell's own
       \`overflow: hidden\` + \`min-height: 0\` (grid items default to
       \`min-height: auto\`, which would otherwise refuse to shrink below the
       content's own intrinsic height regardless of the track's size). Always
       rendered (even collapsed) for any row \`rowDetails\` resolves a template
       for, not just currently-expanded ones — an element toggling between
       these two states, rather than being added/removed from the DOM, is
       what makes the transition play both ways. */
    .row-details {
      display: grid;
      grid-template-rows: 0fr;
      /* On the row itself (spanning every grid-column track), not just
         .row-details-content — that cell only spans the middle columns
         (see detailsColumnStart/detailsColumnEnd in datagrid.ts), leaving
         the leading (checkbox/expander) and trailing (row-actions) tracks
         as bare, differently-colored space either side of it otherwise. */
      background: var(--ui-color-neutral-50);
      transition: grid-template-rows 200ms ease;
    }

    /* Only while expanded — collapsed, this element's own height is ~0, so
       this border would sit flush against .body-row's own border-bottom
       just above it (nothing in between to make them read as separate
       lines), doubling up into what looks like a single but too-thick
       line rather than the usual 1px. */
    .row-details.expanded {
      grid-template-rows: 1fr;
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* Same specificity as .row-details.expanded above (two classes) — needs
       the extra :last-child to outrank it, otherwise an expanded last row's
       own border-bottom would win on source order and double up against
       whatever comes after .body (.pagination-bar's own border-top, or
       nothing), the exact doubling .body-row:last-child/.row-details:last-child
       above already guards against. */
    .row-details.expanded:last-child {
      border-bottom: none;
    }

    /* Re-enables that suppressed border, accented, for a selected last row
       whose own rowDetails trails it (collapsed or expanded — this matches
       either way, see .selected's own doc further up). Has to live after
       the rule directly above: same (three-class) specificity, so this
       only reliably wins the tie by coming later in the file. */
    .row-details.selected:last-child {
      border-bottom: var(--ui-border-thin) solid color-mix(in srgb, var(--datagrid-row-accent) 45%, var(--ui-bg));
    }

    /* An expanded panel's own fill while selected/hovered — the exact same
       mix (against --ui-bg, not the plain --ui-color-neutral-50 base above)
       as .body-row's own selected/hovered background, so a selected or
       hovered row and its own expanded panel read as one continuously-tinted
       surface rather than two visibly different shades. Only .expanded
       matters — a collapsed panel has no visible height for a background to
       show through. */
    .row-details.expanded.selected {
      background: color-mix(in srgb, var(--datagrid-row-accent) 12%, var(--ui-bg));
    }

    /* Same tint, for a hovered row's own expanded panel — both directions,
       same rationale as the border rules above: hovering the collapsed
       \`.body-row\` reaches its trailing sibling panel directly; hovering the
       panel itself is covered on its own. */
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row:hover
      + .row-details.expanded,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .row-details.expanded:hover {
      background: color-mix(in srgb, var(--datagrid-row-accent) 6%, var(--ui-bg));
    }

    /* Selected *and* hovered — same extra bump as .body-row.selected:hover. */
    .row-details.expanded.selected:hover,
    :host(:is([selection-mode="single"], [selection-mode="multi"]))
      .body-row.selected:hover
      + .row-details.expanded {
      background: color-mix(in srgb, var(--datagrid-row-accent) 16%, var(--ui-bg));
    }

    .row-details-content {
      min-height: 0;
      overflow: hidden;
    }

    .row-details-inner {
      padding-block: calc(var(--ui-spacing-md) - 1em);
      padding-inline: var(--ui-spacing-md);
    }

    .empty-message {
      padding: var(--ui-spacing-md);
      text-align: center;
      opacity: 0.6;
    }

    /* Delayed 200ms past a \`dataSource\` request's start (see
       showLoadingSpinner in datagrid.ts) so a fast request never flashes
       this. */
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .spinner {
      width: 4em;
      height: 4em;
      box-sizing: border-box;
      border: calc(6px * var(--ui-scale)) solid color-mix(in srgb, currentColor 20%, transparent);
      border-top-color: var(--ui-color-neutral-500);
      border-radius: 50%;
      animation: datagrid-spin 0.75s linear infinite;
      /* margin, not a static transform — .spinner's own animation already
         owns the transform property for the rotation, and a static
         transform set here would just get replaced by each animation
         frame's own rotation value, never actually shifting anything. This
         nudges it a bit above dead-center of .loading-overlay's
         align-items: center instead. */
      margin-bottom: 3em;
    }

    @keyframes datagrid-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Hand-rolled pagination bar — no third-party grid engine's own bar to
       lean on here. */
    /* One shared font-size for the whole bar — the nav buttons, "Page"/"of
       N" labels, and the page number field all size off this one value
       (\`1em\`, see their own rules) rather than each hardcoding a pixel size
       that'd drift out of sync with the others. */
    .pagination-bar {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-md);
      padding: calc(var(--ui-spacing-sm) * 2.5) var(--ui-spacing-md);
      border-top: var(--ui-border-thin) solid var(--ui-color-neutral-200);
      font-size: var(--ui-font-size-md);
    }

    /* Sits before \`.page-range\` (whose own auto margin pushes everything
       from there on to the right), so this is the one thing left pinned to
       the bar's near edge. */
    .selection-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.2em 0.6em;
      border-radius: 999px;
      background: var(--ui-color-neutral-100);
      color: var(--ui-color-neutral-700);
      font-size: 0.9em;
      font-weight: var(--ui-font-weight-semibold);
      white-space: nowrap;
    }

    .page-size-group,
    .page-nav {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
    }

    /* Twice the bar's own -sm gap between "Page Size:" and its picker. The
       shared rule above is what the nav's row of chevron buttons wants (they
       read as one cluster and shouldn't drift apart), but a label sitting right
       against the control it names reads as crowded rather than grouped. */
    .page-size-group {
      gap: calc(var(--ui-spacing-sm) * 2);
    }


    /* Same idea as the header's own column divider — a fixed 1.25em, 2px
       line, not a full-height border. An extra 1.75em margin (on top of the
       bar's own \`gap\`) gives a full 1.75em of breathing room on each side
       of the line itself; the offset centers it in that combined space (bar
       \`gap\` + the added 1.75em) via \`calc()\` rather than assuming the two
       happen to match. Scoped to \`.page-range\`/\`.page-size-group\`
       specifically (not \`.selection-badge\`, whose own gap to \`.page-range\`
       is a wide, variable auto-margin push rather than the bar's uniform
       \`gap\` — centering a line in *that* would leave it floating). */
    .pagination-bar > .page-range,
    .pagination-bar > .page-size-group {
      position: relative;
      margin-inline-end: 1.75em;
    }

    .pagination-bar > .page-range::after,
    .pagination-bar > .page-size-group::after {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline-end: calc((var(--ui-spacing-md) + 1.75em) / -2);
      margin-block: auto;
      width: calc(2px * var(--ui-scale));
      height: 1.25em;
      background: var(--ui-color-neutral-200);
    }

    .page-label {
      opacity: 0.7;
      white-space: nowrap;
    }

    .page-size {
      --select-min-width: 4.5em;
    }

    /* Pushed to the far end of the bar via its own auto margin — so the
       range text, the size picker, and the nav buttons that follow all end
       up grouped together on the right, instead of \`.page-range\` sitting
       alone on the left. */
    .page-range {
      margin-inline-start: auto;
      opacity: 0.7;
      white-space: nowrap;
    }

    .page-input {
      width: 3em;
      /* Breathing room on both sides of the page number, as its own margin
         rather than a wider .page-nav gap: that gap also spaces the four
         chevron buttons from each other, and only this number — flanked by the
         "Page" label and the "of N" text — needs pulling away from its
         neighbours. Adds to the inherited gap, so each side ends up at 2× -sm,
         matching .page-size-group's own gap. */
      margin-inline: var(--ui-spacing-sm);
    }
  `,
];
