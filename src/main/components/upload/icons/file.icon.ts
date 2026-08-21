import { html } from "lit";

// A generic document glyph for each row in the file list — deliberately
// unspecific (no per-mime-type variants), matching the level of detail of the
// rest of this component.
export const fileIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
    <path d="M6 4h4v1H6zm0 3h4v1H6zm0 3h3v1H6z"/>
  </svg>
`;
