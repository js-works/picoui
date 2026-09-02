// The framework-agnostic half of the multi-select "pill" support — the
// value-list bookkeeping, no rendering, no Lit import.

export { togglePillValue, removePillValue, buildMultiFormData };

// Add-or-remove membership — used when picking from the list (toggling a pick
// on/off), as opposed to removePillValue's unconditional removal (the pill's
// own remove button).
function togglePillValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

function removePillValue(values: readonly string[], value: string): string[] {
  return values.filter((v) => v !== value);
}

// One FormData entry per selected value, all under the same field `name` — the
// browser folds repeated entries into the parent form's submission the same
// way a native `<select multiple>` would.
function buildMultiFormData(name: string, values: readonly string[]): FormData {
  const formData = new FormData();
  for (const value of values) formData.append(name, value);
  return formData;
}
