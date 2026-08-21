// Shared by ui-select, ui-combobox, and ui-autocomplete to keep the active option
// visible inside a scrollable listbox.
//
// Rolled by hand rather than option.scrollIntoView(): that aligns the option flush
// with the listbox's padding edge, which — once scrolled — leaves the
// padding-block reserved space permanently scrolled past even when back at the
// first/last option. Comparing against the padding edges directly keeps the
// padding visible at both ends.
export function scrollIntoListboxView(
  listbox: HTMLElement,
  option: HTMLElement,
): void {
  const listboxStyle = getComputedStyle(listbox);
  const paddingTop = parseFloat(listboxStyle.paddingTop);
  const paddingBottom = parseFloat(listboxStyle.paddingBottom);
  const listboxRect = listbox.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();

  const topEdge = listboxRect.top + paddingTop;
  const bottomEdge = listboxRect.bottom - paddingBottom;

  if (optionRect.top < topEdge) {
    listbox.scrollTop -= topEdge - optionRect.top;
  } else if (optionRect.bottom > bottomEdge) {
    listbox.scrollTop += optionRect.bottom - bottomEdge;
  }
}
