// The framework-agnostic half of shared/pills — the value-list bookkeeping
// behind multi-select's removable "pills", with no rendering and (unlike
// pills.ts) no Lit import. Kept separate so a vanilla core that only needs the
// value math (autocomplete-core.ts) can use it without pulling Lit in.
// pills.ts re-exports all three for callers that want them alongside
// renderPills/pillsStyles.

export { togglePillValue, removePillValue, buildMultiFormData };

// Add-or-remove membership — used when picking from the list (toggling a
// pick on/off), as opposed to removePillValue's unconditional removal (used
// by the pill's own remove button).
function togglePillValue(values: readonly string[], value: string): string[] {
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
