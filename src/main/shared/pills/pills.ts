// Shared multi-select "pill" behavior and markup — the removable tag row
// used by ui-select's, ui-combobox's, and ui-autocomplete's `multiple` mode.
// Still Lit-coupled for now (renderPills returns a Lit template) rather than
// the framework-agnostic vanilla-core shape shared/popup-layout/popup-layout.ts
// ended up with — that's a deliberate next step, not this one.

import { html, nothing, css, type TemplateResult } from "lit";

export { renderPills, togglePillValue, removePillValue, buildMultiFormData, pillsStyles };

// Renders one pill per entry, each with its own remove button. Callers
// decide whether to call this at all (typically gated on their own
// `multiple`) — an empty `pills` array renders nothing on its own, same as
// omitting the call.
//
// `maxVisible`, if given, caps how many actual pills render — the rest
// collapse into one trailing "+N" summary pill (title-tooltipped with the
// hidden labels) rather than disappearing outright, so a caller with e.g. 30
// picks doesn't have its trigger balloon to 30 pills wide.
function renderPills(
  pills: readonly { value: string; label: string }[],
  onRemove: (value: string, event: Event) => void,
  maxVisible?: number,
): TemplateResult | typeof nothing {
  if (pills.length === 0) return nothing;
  const visible =
    maxVisible !== undefined ? pills.slice(0, maxVisible) : pills;
  const hidden = pills.slice(visible.length);
  return html`${visible.map(
    (pill) => html`<span class="pill">
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
  )}${hidden.length > 0
    ? html`<span
        class="pill pill-overflow"
        title=${hidden.map((pill) => pill.label).join(", ")}
      >
        +${hidden.length}
      </span>`
    : nothing}`;
}

// Add-or-remove membership — used when picking from the list (toggling a
// pick on/off), as opposed to removePillValue's unconditional removal (used
// by the pill's own remove button).
function togglePillValue(
  values: readonly string[],
  value: string,
): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

function removePillValue(values: readonly string[], value: string): string[] {
  return values.filter((v) => v !== value);
}

// One FormData entry per selected value, all under the same field `name` —
// the browser folds repeated entries into the parent form's submission the
// same way a native `<select multiple>` would.
function buildMultiFormData(name: string, values: readonly string[]): FormData {
  const formData = new FormData();
  for (const value of values) formData.append(name, value);
  return formData;
}

// The pill's own look — identical regardless of which element hosts it
// (ui-combobox's/ui-autocomplete's .wrapper, ui-select's .trigger). Whether
// that host needs extra start-padding once pills are present (:has(.pill))
// is left to each component's own styles, since which element that is
// differs between them.
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
    /* 0.875em (of the host control's own font-size), not the flat
       --ui-font-size-sm token this used to be: at the default size="medium"
       the two are the exact same 14px, but a size="small"/"large" control now
       gets proportionally smaller/larger pills instead of one fixed pill size
       for all three. A pill's height is what floors the trigger's own height
       (see each component's .content min-height, derived from this) — with a
       fixed pill size that floor was identical across all three sizes and
       flattened the size progression to just the trigger's padding. */
    font-size: 0.875em;
    line-height: 1;
  }

  /* The "+N" summary pill (see renderPills' \`maxVisible\`) — same look as a
     regular pill (just no remove button), with its own pointer cursor since
     hovering it is what reveals which values it's hiding (the title
     tooltip). A regular pill's height comes from .pill-remove (font-size:
     1.4em, line-height: 1) being its tallest child — with no button of its
     own, this pill would otherwise render shorter. line-height: 1.4 (at this
     pill's own, unchanged font-size) reproduces that same line-box height
     without actually enlarging the "+N" text itself. */
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
