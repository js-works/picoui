import { html } from "lit";

// Bootstrap Icons (chevron-down), used as ui-menu-button's own trigger
// affordance — same icon ui-select uses, kept as its own local copy per
// this package's established per-component convention (see e.g.
// combobox/icons/chevron.icon.ts, autocomplete/icons/chevron.icon.ts).
export const chevronDownIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
  </svg>
`;
