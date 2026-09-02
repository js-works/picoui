// Shared multi-select "pill" markup + styles — the removable tag row used by
// the select / combobox / autocomplete `multiple` modes.

import { html, nothing, css, type TemplateResult } from "lit";

import {
  togglePillValue,
  removePillValue,
  buildMultiFormData,
} from "./pill-values.js";

export { renderPills, pillsStyles };
export { togglePillValue, removePillValue, buildMultiFormData };

// Renders one pill per entry, each with its own remove button. An empty
// `pills` array renders nothing, same as omitting the call.
//
// `maxVisible`, if given, caps how many pills render — the rest collapse into
// one trailing "+N" summary pill (title-tooltipped with the hidden labels).
function renderPills(
  pills: readonly { value: string; label: string }[],
  onRemove: (value: string, event: Event) => void,
  maxVisible?: number,
): TemplateResult | typeof nothing {
  if (pills.length === 0) return nothing;
  const visible = maxVisible !== undefined ? pills.slice(0, maxVisible) : pills;
  const hidden = pills.slice(visible.length);
  return html`${visible.map(
    (pill) =>
      html`<span class="pill">
        <span class="pill-label">${pill.label}</span>
        <button
          type="button"
          class="pill-remove"
          aria-label="Remove ${pill.label}"
          @pointerdown=${(event: Event) => onRemove(pill.value, event)}
        >
          ×
        </button>
      </span>`,
  )}${
    hidden.length > 0
      ? html`<span
          class="pill pill-overflow"
          title=${hidden.map((pill) => pill.label).join(", ")}
        >
          +${hidden.length}
        </span>`
      : nothing
  }`;
}

const pillsStyles = css`
  .pill {
    display: inline-flex;
    align-items: center;
    gap: calc(6px * var(--ui-scale));
    flex: none;
    background: var(--ui-color-neutral-200);
    color: var(--ui-color-neutral-800);
    border: var(--ui-border-thin) solid var(--ui-color-neutral-300);
    border-radius: calc(3px * var(--ui-scale));
    padding-block: calc(1px * var(--ui-scale));
    padding-inline-start: calc(6px * var(--ui-scale));
    padding-inline-end: var(--ui-spacing-sm);
    font-size: 0.875em;
    line-height: 1;
  }

  .pill-overflow {
    cursor: pointer;
    line-height: 1.4;
  }

  .pill-remove {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1.4em;
    line-height: 1;
    padding: 0;
    cursor: pointer;
    opacity: 0.7;
  }

  .pill-remove:hover {
    opacity: 1;
  }
`;
