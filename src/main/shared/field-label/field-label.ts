// Shared `label` rendering for every form-associated component in this
// library — a plain visible caption above the control, rather than each
// component inventing its own copy of the same handful of CSS declarations.
//
// Two variants, not one, because "what does label point at" differs:
// - renderFieldLabel: a real `<label for="...">` for components with exactly
//   one focusable/interactive element to associate with (an `<input>`, or
//   ui-select's `.trigger`) — clicking the label focuses/activates it, and
//   it becomes that element's accessible name natively, no ARIA needed.
// - renderGroupLabel: a plain (non-`for`) element for group components
//   (ui-checkbox-group, ui-radio-group) that wrap several independently
//   focusable children — there's no single element a `for` could point at,
//   so the caller pairs this with `aria-labelledby` on the group container
//   instead (see those components for the exact wiring).

import { html, nothing, css, type TemplateResult } from "lit";

export { renderFieldLabel, renderGroupLabel, fieldLabelStyles };

function renderFieldLabel(
  label: string,
  forId: string,
): TemplateResult | typeof nothing {
  if (!label) return nothing;
  return html`<label class="field-label" for=${forId}>${label}</label>`;
}

function renderGroupLabel(
  label: string,
  id: string,
): TemplateResult | typeof nothing {
  if (!label) return nothing;
  return html`<div class="field-label" id=${id}>${label}</div>`;
}

const fieldLabelStyles = css`
  .field-label {
    display: block;
    margin-block-end: var(--ui-spacing-sm);
    font-size: var(--ui-font-size-sm);
    font-weight: 600;
    color: var(--ui-text);
  }
`;
