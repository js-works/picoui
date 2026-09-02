// Experimental field family — a parallel take on the input components built on
// a layered base: `FormControlElement` (form participation + validity + the
// message row, layout-agnostic) → `FieldElement` (one native control, string
// value, bordered box) → `TextFieldElement` (the free-text surface). Fully
// self-contained under src/uu/ — no runtime dependency on src/main (its design
// tokens, popup layout, pill helpers and list/autocomplete engines are all
// local copies here). Not part of the library build (tsconfig.build.json is
// scoped to src/main); wired into the demo only.
//
// Importing this module registers the elements as a side effect; that is a
// convenience of the entry point, not a contract — a consumer may instead
// import the classes and call `customElements.define` with names of its own.

export { FormControlElement } from "./base/form-control-element.js";
export { FieldElement } from "./base/field-element.js";
export { TextFieldElement } from "./base/text-field-element.js";
export type {
  FormControlConfig,
  FormControlRenderApi,
  FieldValidity,
} from "./base/form-control-core.js";
export type {
  FieldConfig,
  FieldControl,
  FieldControlIds,
} from "./base/field-element.js";

import "./components/uu-text-field.js";
import "./components/uu-email-field.js";
import "./components/uu-password-field.js";
import "./components/uu-number-field.js";
import "./components/uu-date-field.js";
import "./components/uu-select.js";
import "./components/uu-combobox.js";
import "./components/uu-autocomplete.js";

export type { TextField } from "./components/uu-text-field.js";
export type { EmailField } from "./components/uu-email-field.js";
export type { PasswordField } from "./components/uu-password-field.js";
export type { NumberField } from "./components/uu-number-field.js";
export type { DateField } from "./components/uu-date-field.js";
export type { Select } from "./components/uu-select.js";
export type { Combobox } from "./components/uu-combobox.js";
export type { Autocomplete } from "./components/uu-autocomplete.js";
export {
  localFilter,
  type AutocompleteItemGroup,
  type AutocompleteDataSource,
  type AutocompleteResult,
} from "./components/uu-autocomplete.js";
export type { Option } from "./components/uu-option.js";
export type { OptionGroup } from "./components/uu-option-group.js";
