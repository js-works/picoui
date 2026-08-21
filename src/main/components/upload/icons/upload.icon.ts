import { html } from "lit";

// A plain upward arrow over a baseline — the dropzone's own glyph, drawn from
// scratch (not vendored) since it's just two straight-line shapes.
export const uploadIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M7.5 2.5a.5.5 0 0 1 1 0v8.793l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 11.293z"/>
    <path d="M2.5 13.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
  </svg>
`;
