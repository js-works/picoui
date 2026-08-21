import { html } from "lit";

// Bootstrap Icons (chevron-right) — the row-details expander toggle, rotated
// 90° from pointing right to pointing down when expanded (see
// .expander-toggle.expanded in datagrid.styles.ts) — the standard disclosure-
// triangle convention. Its own file (not a reuse of chevron-right.icon.ts)
// since that one is a different glyph source (Lucide) used for pagination.
export const expanderChevronIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
  </svg>
`;
