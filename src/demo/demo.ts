import { html, nothing, render } from "lit";

import { defaultTheme } from "../main/themes/theme.js";
import "../main/components/heading/heading.js";
import "../main/components/text/text.js";
import "../main/components/link/link.js";
import "../main/components/checkbox/checkbox.js";
import type { Checkbox } from "../main/components/checkbox/checkbox.js";
import "../main/components/checkbox/checkbox-group.js";
import "../main/components/radio/radio-button.js";
import "../main/components/radio/radio-group.js";
import "../main/components/button/button.js";
import type { Button } from "../main/components/button/button.js";
import "../main/components/menu-button/menu-button.js";
import type {
  MenuEntry,
  MenuSelectDetail,
} from "../main/components/menu-button/menu-button.js";
import "../main/components/split-button/split-button.js";
import "../main/components/select/select.js";
import type { Select } from "../main/components/select/select.js";
import "../main/components/combobox/combobox.js";
import "../main/components/autocomplete/autocomplete.js";
import { localFilter } from "../main/components/autocomplete/autocomplete.js";
import type { AutocompleteItemGroup } from "../main/components/autocomplete/autocomplete.js";
import "../main/components/datagrid/datagrid.js";
import type {
  DataGridAction,
  DataGridColumnFilter,
  DataGridColumnOrGroup,
  DataGridDataSource,
  DataGridRowDetails,
  DataGridRowAction,
} from "../main/components/datagrid/datagrid.js";
import {
  textFilter,
  selectFilter,
} from "../main/components/datagrid/filters.js";
import "../main/components/text-field/text-field.js";
import "../main/components/textarea/textarea.js";
import "../main/components/number-field/number-field.js";
import "../main/components/password-field/password-field.js";
import "../main/components/email-field/email-field.js";
import "../main/components/date-field/date-field.js";
import type {
  DateField,
  DateFieldSelectionMode,
} from "../main/components/date-field/date-field.js";
import "../main/components/native-date-field/native-date-field.js";
import "../uu/index.js";
import "../main/components/date-picker/date-picker.js";
import type {
  DatePicker,
  DatePickerSelectionMode,
} from "../main/components/date-picker/date-picker.js";
import "../main/components/upload/upload.js";
import "../main/components/tabs/tabs.js";
import type { Tabs } from "../main/components/tabs/tabs.js";
import type {
  Upload,
  UploadFileRejectDetail,
  UploadRequestDetail,
} from "../main/components/upload/upload.js";

// Adopts the library's own theme tokens (--ui-bg, --ui-text, --ui-color-*, ...)
// at the document level (see theme.ts's `:root` selector) so the demo page's own
// chrome — not just the components it hosts — tracks whichever theme is active.
document.adoptedStyleSheets = [
  ...document.adoptedStyleSheets,
  defaultTheme.styleSheet!,
];

// Sample data for the ui-button demo below.
const BUTTON_TONES = [
  "neutral",
  "primary",
  "danger",
  "warning",
  "success",
] as const;
const BUTTON_VARIANTS = [
  "solid",
  "outlined",
  "filled",
  "subtle",
  "link",
] as const;

// Attribute values (tone/variant) stay lowercase to match the
// component's own API — this only capitalizes what's shown as button text.
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Sample data for the ui-menu-button/ui-split-button demos below — two
// levels of nested ui-submenu deep (Share > Export as) so drilling in/back
// out actually has somewhere to go, plus a disabled leaf, a danger leaf,
// and separators.
const SAMPLE_MENU_ITEMS: MenuEntry[] = [
  { value: "edit", label: "Edit" },
  { value: "duplicate", label: "Duplicate" },
  { type: "separator" },
  {
    type: "submenu",
    value: "share",
    label: "Share",
    items: [
      { value: "share-link", label: "Copy link" },
      { value: "share-email", label: "Email a copy" },
      {
        type: "submenu",
        value: "export",
        label: "Export as",
        items: [
          { value: "export-pdf", label: "PDF" },
          { value: "export-csv", label: "CSV" },
          {
            value: "export-json",
            label: "JSON",
            disabled: true,
          },
        ],
      },
    ],
  },
  { value: "archive", label: "Archive" },
  { type: "separator" },
  { value: "delete", label: "Delete", danger: true },
];

// Sample data for the ui-combobox/ui-autocomplete demos below — grouped to show
// the labeled separators a group produces in the dropdown.
const FRUITS: AutocompleteItemGroup[] = [
  { label: "Citrus", items: ["Grapefruit", "Lemon", "Lime", "Orange"] },
  {
    label: "Berries",
    items: ["Blackberry", "Blueberry", "Raspberry", "Strawberry"],
  },
  {
    label: "Stone fruits",
    items: ["Apricot", "Cherry", "Nectarine", "Peach", "Plum"],
  },
  { label: "Melons", items: ["Melon", "Watermelon"] },
  {
    label: "Tropical",
    items: [
      "Avocado",
      "Banana",
      "Kiwi",
      "Mango",
      "Papaya",
      "Pineapple",
      "Pomegranate",
    ],
  },
  { label: "Other", items: ["Apple", "Grape", "Pear"] },
];

// Sample data for the ui-datagrid demos below.
interface Employee {
  name: string;
  email: string;
  department: string;
  role: string;
}

const FIRST_NAMES = [
  "Jane",
  "John",
  "Alice",
  "Bob",
  "Carol",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Hank",
  "Ivy",
  "Jack",
  "Karen",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rachel",
  "Sam",
  "Tina",
  "Uma",
  "Victor",
  "Wendy",
  "Xander",
  "Yara",
  "Zack",
];
const LAST_NAMES = [
  "Doe",
  "Smith",
  "Johnson",
  "Williams",
  "Martinez",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Clark",
  "Lewis",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "King",
  "Wright",
  "Scott",
  "Green",
];
const DEPARTMENT_ROLES: Record<string, string[]> = {
  Engineering: [
    "Engineer",
    "Senior Engineer",
    "Junior Engineer",
    "Engineering Manager",
  ],
  Sales: ["Account Executive", "Sales Manager"],
  Support: ["Support Agent", "Support Lead"],
  Marketing: ["Marketing Lead", "Content Strategist", "Designer"],
};
const DEPARTMENTS = Object.keys(DEPARTMENT_ROLES);

// 123 rows — enough to exercise sorting/filtering/pagination realistically.
// Deterministic (no Math.random()) so the demo looks the same on every reload.
const EMPLOYEES: Employee[] = Array.from({ length: 123 }, (_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last =
    LAST_NAMES[(i + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
  const department = DEPARTMENTS[i % DEPARTMENTS.length];
  const roles = DEPARTMENT_ROLES[department];
  const role = roles[Math.floor(i / DEPARTMENTS.length) % roles.length];
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
    department,
    role,
  };
});

// Every distinct department, computed once from the full in-memory dataset.
// The "select" filter's dropdown needs this list, but
// employeeDataGridDataSource (below) only ever sees the one page it was asked
// for — never the full dataset — so the options can't be derived on the fly
// from the rows the grid currently holds; hence this precomputed list.
const employeeDepartmentOptions = [
  ...new Set(EMPLOYEES.map((employee) => employee.department)),
].sort();

const plusIcon = html`
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M8 2a.75.75 0 0 1 .75.75V7.25h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2"
    />
  </svg>
`;

const pencilIcon = html`
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zM12.793 5.5 10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"
    />
  </svg>
`;

const trashIcon = html`
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
    />
    <path
      fill-rule="evenodd"
      d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"
    />
  </svg>
`;

// Sample columns for the ui-datagrid demos below. "Name"/"Email"/"Role" get
// the plain text filter (a ui-text-field); "Department" gets the "select"
// dropdown instead, since it's really a small fixed set of values rather than
// free text. ui-datagrid's own `width` is a fraction of the sum of every
// column's width (default 100), not a pixel value, so "Email" getting more
// room than the rest is expressed as a bigger share (200).
// Flat version — every column stands alone, no grouping. Demonstrates the
// ungrouped (single header row) layout.
const employeeDataGridColumnsFlat: DataGridColumnOrGroup<Employee>[] = [
  { field: "name", header: "Name", filter: textFilter() },
  { field: "email", header: "Email", width: 200, filter: textFilter() },
  {
    field: "department",
    header: "Department",
    filter: selectFilter({ options: employeeDepartmentOptions }),
  },
  { field: "role", header: "Role", filter: textFilter() },
];

// Same columns as the flat version above, except "Email"/"Department" share
// a "Contact & Org" group header instead of standing alone — demonstrates
// the grouped (two header row) layout ("Name" and "Role" still stand
// alone, their own header cell spanning both header rows).
const employeeDataGridColumns: DataGridColumnOrGroup<Employee>[] = [
  { field: "name", header: "Name", filter: textFilter() },
  {
    header: "Contact & Org",
    columns: [
      { field: "email", header: "Email", width: 200, filter: textFilter() },
      {
        field: "department",
        header: "Department",
        filter: selectFilter({ options: employeeDepartmentOptions }),
      },
    ],
  },
  { field: "role", header: "Role", filter: textFilter() },
];

// Only Engineering rows get an expander — demonstrates the "some rows may
// have none" case (DataGridRowDetails returns undefined for the rest).
const employeeRowDetails: DataGridRowDetails<Employee> = (employee) =>
  employee.department === "Engineering"
    ? html`
        <p>
          <strong>${employee.name}</strong> — additional detail shown only for
          Engineering rows, to demonstrate a mixed page (rows without any get no
          expander at all).
        </p>
      `
    : undefined;

// Toolbar actions, which need a selection. Action callbacks just console.log
// — this demo has no shared result log. Reads selection off ui-datagrid's own
// selection state.
const employeeDataGridActions: DataGridAction<Employee>[] = [
  {
    type: "general",
    label: "Add employee",
    icon: plusIcon,
    onClick: () => console.log("Add employee"),
  },
  {
    type: "single",
    label: "Edit",
    icon: pencilIcon,
    onClick: (selected) => console.log("Edit", selected[0].name),
  },
  {
    type: "multi",
    label: "Delete selected",
    icon: trashIcon,
    onClick: (selected) =>
      console.log(
        "Delete selected",
        selected.map((employee) => employee.name),
      ),
  },
];

// Per-row inline actions, rendered directly in the row (unlike the toolbar
// actions above, which need a selection). "Edit" disables itself for
// Marketing rows, demonstrating the per-row `disabled` predicate; "Edit"
// leaves `appearance` at its "primary" default while "Delete" opts into
// "danger", demonstrating the per-action override. Like every other action
// in this demo, both just console.log — no shared result log.
const employeeRowActions: DataGridRowAction<Employee>[] = [
  {
    label: "Edit",
    icon: pencilIcon,
    disabled: (employee) => employee.department === "Marketing",
    onClick: (employee) => console.log("Edit", employee.name),
  },
  {
    label: "Delete",
    icon: trashIcon,
    appearance: "danger",
    onClick: (employee) => console.log("Delete", employee.name),
  },
];

// Simulates a real server endpoint for ui-datagrid's own `dataSource` — every
// sort/filter/page change re-invokes this (not just the initial load), each
// one taking a simulated ~1000ms round trip, so the grid genuinely waits on a
// "request" for every interaction rather than just the first render.
// Filtering/sorting/pagination all happen here, against the same in-memory
// EMPLOYEES array a real server would instead run against a database.
const employeeDataGridDataSource: DataGridDataSource<Employee> = ({
  startRow,
  endRow,
  sort,
  filters,
  signal,
}) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      let rows = EMPLOYEES.slice();

      for (const [field, filter] of Object.entries(filters) as [
        keyof Employee & string,
        DataGridColumnFilter,
      ][]) {
        rows = Array.isArray(filter)
          ? rows.filter((row) => filter.includes(String(row[field])))
          : rows.filter((row) =>
              String(row[field])
                .toLowerCase()
                .includes(String(filter).toLowerCase()),
            );
      }

      for (const { field, direction } of sort.slice().reverse()) {
        rows.sort((a, b) => {
          const cmp = String(a[field]).localeCompare(String(b[field]));
          return direction === "desc" ? -cmp : cmp;
        });
      }

      resolve({ rows: rows.slice(startRow, endRow), rowCount: rows.length });
    }, 1000);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

function typographyTab() {
  return html`
    <section>
      <h2>Heading</h2>
      <p>
        <code>level</code> (1–6) alone already picks a sensible default size —
        the same way a bare <code>&lt;h1&gt;</code>…<code>&lt;h6&gt;</code>
        would. <code>role="heading"</code>/<code>aria-level</code> reproduce the
        document-outline semantics a real heading tag would give for free.
      </p>
      <div class="row" style="flex-direction: column; align-items: stretch;">
        <ui-heading level="1">Heading level 1</ui-heading>
        <ui-heading level="2">Heading level 2</ui-heading>
        <ui-heading level="3">Heading level 3</ui-heading>
        <ui-heading level="4">Heading level 4</ui-heading>
        <ui-heading level="5">Heading level 5</ui-heading>
        <ui-heading level="6">Heading level 6</ui-heading>
      </div>
      <p>
        <code>size</code> overrides the level-driven default — for an
        <code>&lt;h2&gt;</code> that should read smaller than its own level
        implies, without lying about the document outline.
      </p>
      <div class="row">
        <ui-heading level="2" size="small">Small h2</ui-heading>
      </div>
      <p><code>tone</code> — same five values as <code>ui-button</code>.</p>
      <div class="row" style="flex-direction: column; align-items: stretch;">
        <ui-heading level="3" tone="primary">Primary heading</ui-heading>
        <ui-heading level="3" tone="danger">Danger heading</ui-heading>
        <ui-heading level="3" tone="warning">Warning heading</ui-heading>
        <ui-heading level="3" tone="success">Success heading</ui-heading>
      </div>
      <p>
        <code>truncate</code> — a single line, ellipsized rather than wrapping.
      </p>
      <div class="row" style="width: 20em;">
        <ui-heading level="3" truncate style="width: 100%">
          A heading with far too much text to fit on one line at this width
        </ui-heading>
      </div>
    </section>

    <section>
      <h2>Text</h2>
      <p>
        The plain-text counterpart to <code>ui-heading</code> — body copy,
        captions, helper/error text. <code>as</code> controls block-vs-inline
        flow rather than swapping the underlying element.
      </p>
      <div class="row" style="flex-direction: column; align-items: stretch;">
        <ui-text as="p">
          A paragraph of body copy, rendered block-level with its own trailing
          spacing (<code>as="p"</code>) so a second paragraph right after it
          doesn't run straight into it.
        </ui-text>
        <ui-text as="p"> A second paragraph, to show that spacing. </ui-text>
      </div>
      <p>
        <code>size</code>/<code>weight</code>/<code>tone</code> — same scales as
        everywhere else in this library.
      </p>
      <div class="row" style="flex-direction: column; align-items: stretch;">
        <ui-text size="small" tone="neutral"
          >Small helper text under a field.</ui-text
        >
        <ui-text weight="semibold">Semibold emphasis.</ui-text>
        <ui-text tone="danger">Something went wrong.</ui-text>
        <ui-text tone="success">Saved successfully.</ui-text>
      </div>
      <p>
        <code>muted</code> — dimmed via opacity, tracking whatever
        <code>tone</code> is set rather than a flat gray.
      </p>
      <div class="row">
        <ui-text muted>Optional — leave blank to skip this step.</ui-text>
      </div>
      <p>
        <code>truncate</code> (single line) and <code>clamp</code> (a fixed
        number of lines).
      </p>
      <div class="row" style="width: 20em;">
        <ui-text as="div" truncate style="width: 100%">
          This line of text is far too long to fit in twenty characters of
          width, so it gets cut off with an ellipsis.
        </ui-text>
      </div>
      <div class="row" style="width: 20em;">
        <ui-text as="div" clamp="2">
          This description runs long enough to wrap past two lines, at which
          point the third line and beyond are clipped with a trailing ellipsis
          instead of pushing the layout around it taller and taller.
        </ui-text>
      </div>
    </section>

    <section>
      <h2>Link</h2>
      <p>
        Wraps a real <code>&lt;a&gt;</code> — focus, keyboard activation, and
        middle-click/ctrl-click-to-open-in-new-tab all come from the native
        element. <code>tone</code> defaults to <code>"primary"</code> (unlike
        <code>ui-heading</code>/<code>ui-text</code>, which default to
        <code>"neutral"</code>) — a bare link should already read as a link.
      </p>
      <div class="row">
        <ui-text as="p">
          Read the
          <ui-link href="https://lit.dev" target="_blank"> Lit docs </ui-link>
          for more, or
          <ui-link href="#" tone="danger">delete your account</ui-link>
          instead.
        </ui-text>
      </div>
      <div class="row">
        <ui-link href="#" tone="neutral">Neutral</ui-link>
        <ui-link href="#" tone="primary">Primary</ui-link>
        <ui-link href="#" tone="danger">Danger</ui-link>
        <ui-link href="#" tone="warning">Warning</ui-link>
        <ui-link href="#" tone="success">Success</ui-link>
      </div>
    </section>
  `;
}

function buttonsTab() {
  const onSelect = (event: CustomEvent<MenuSelectDetail>) =>
    console.log("Menu select:", event.detail.value, "path:", event.detail.path);

  return html`
    <section class="button-showcase">
      <h2>Buttons</h2>
      <div class="button-grid">
        ${BUTTON_TONES.map(
          (tone) => html`
            <span class="page-label">${tone}</span>
            ${BUTTON_VARIANTS.map(
              (variant) => html`
                <ui-button tone=${tone} variant=${variant}>
                  ${capitalize(variant)}
                </ui-button>
              `,
            )}
          `,
        )}
      </div>
      <div class="row">
        <ui-button size="small">Small</ui-button>
        <ui-button size="medium">Medium</ui-button>
        <ui-button size="large">Large</ui-button>
        <ui-button disabled>Disabled</ui-button>
        <ui-button
          tone="primary"
          @click=${(event: Event) => {
            const btn = event.currentTarget as Button;
            setTimeout(() => {
              btn.loading = true;
              setTimeout(() => {
                btn.loading = false;
              }, 1500);
            }, 200);
          }}
        >
          Click to load
        </ui-button>
        <ui-button tone="primary" variant="outlined" type="submit">
          <svg
            slot="prefix"
            viewBox="0 0 16 16"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"
            />
          </svg>
          With icon
        </ui-button>
      </div>
      <div class="row">
        <ui-button full-width tone="success">Full-width button</ui-button>
      </div>
    </section>

    <section>
      <h2>Menu button</h2>
      <p>
        Drill-down menu — picking "Share" or "Export as" slides to that
        submenu's own page (with a back button) instead of cascading a flyout
        beside it; "Export as" > JSON is disabled.
      </p>
      <div class="row">
        <ui-menu-button
          tone="primary"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Actions
        </ui-menu-button>
        <ui-menu-button
          tone="neutral"
          variant="outlined"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Outlined
        </ui-menu-button>
        <ui-menu-button
          tone="primary"
          variant="subtle"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Subtle
        </ui-menu-button>
        <ui-menu-button tone="primary" disabled .items=${SAMPLE_MENU_ITEMS}>
          Disabled
        </ui-menu-button>
      </div>
      <div class="row">
        <ui-menu-button
          size="small"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Small
        </ui-menu-button>
        <ui-menu-button
          size="medium"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Medium
        </ui-menu-button>
        <ui-menu-button
          size="large"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Large
        </ui-menu-button>
      </div>
    </section>

    <section>
      <h2>Split button</h2>
      <p>
        The left segment is a plain button (its own click event); the right,
        chevron-only segment opens the same drill-down menu as ui-menu-button
        above.
      </p>
      <div class="row">
        <ui-split-button
          tone="primary"
          .items=${SAMPLE_MENU_ITEMS}
          @click=${() => console.log("Save clicked")}
          @menu-select=${onSelect}
        >
          Save
        </ui-split-button>
        <ui-split-button
          tone="danger"
          variant="outlined"
          menu-label="More delete options"
          .items=${SAMPLE_MENU_ITEMS}
          @click=${() => console.log("Delete clicked")}
          @menu-select=${onSelect}
        >
          Delete
        </ui-split-button>
        <ui-split-button tone="primary" disabled .items=${SAMPLE_MENU_ITEMS}>
          Disabled
        </ui-split-button>
      </div>
      <div class="row">
        <ui-split-button
          size="small"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Small
        </ui-split-button>
        <ui-split-button
          size="medium"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Medium
        </ui-split-button>
        <ui-split-button
          size="large"
          .items=${SAMPLE_MENU_ITEMS}
          @menu-select=${onSelect}
        >
          Large
        </ui-split-button>
      </div>
    </section>
  `;
}

function radiosAndCheckboxesTab() {
  return html`
    <section>
      <h2>Radio group</h2>
      <div class="row">
        <ui-radio-group name="shipping" value="standard">
          <ui-radio-button value="standard"
            >Standard (5-7 days)</ui-radio-button
          >
          <ui-radio-button value="express">Express (2 days)</ui-radio-button>
          <ui-radio-button value="overnight">Overnight</ui-radio-button>
          <ui-radio-button value="pickup" disabled
            >Store pickup (unavailable)</ui-radio-button
          >
        </ui-radio-group>
      </div>
      <div class="row">
        <ui-radio-group orientation="horizontal" name="size" value="m">
          <ui-radio-button value="s">S</ui-radio-button>
          <ui-radio-button value="m">M</ui-radio-button>
          <ui-radio-button value="l">L</ui-radio-button>
          <ui-radio-button value="xl">XL</ui-radio-button>
        </ui-radio-group>
      </div>
      <div class="row">
        <ui-radio-group disabled name="disabled-example" value="one">
          <ui-radio-button value="one">One</ui-radio-button>
          <ui-radio-button value="two">Two</ui-radio-button>
        </ui-radio-group>
      </div>
    </section>

    <section>
      <h2>Checkbox group</h2>
      <div class="row">
        <ui-checkbox-group name="toppings" required>
          <ui-checkbox value="cheese">Cheese</ui-checkbox>
          <ui-checkbox value="pepperoni">Pepperoni</ui-checkbox>
          <ui-checkbox value="mushrooms">Mushrooms</ui-checkbox>
          <ui-checkbox value="olives" disabled>Olives (sold out)</ui-checkbox>
        </ui-checkbox-group>
      </div>
      <div class="row">
        <ui-checkbox-group orientation="horizontal" .values=${["a", "c"]}>
          <ui-checkbox value="a">A</ui-checkbox>
          <ui-checkbox value="b">B</ui-checkbox>
          <ui-checkbox value="c">C</ui-checkbox>
        </ui-checkbox-group>
      </div>
      <div class="row">
        <ui-checkbox-group disabled>
          <ui-checkbox value="x">X</ui-checkbox>
          <ui-checkbox value="y">Y</ui-checkbox>
        </ui-checkbox-group>
      </div>
    </section>
  `;
}

function inputFieldsTab() {
  return html`
    <section>
      <h2>Text field</h2>
      <div class="row">
        <ui-text-field label="Full name"></ui-text-field>
      </div>
      <div class="row">
        <ui-text-field size="small" label="Small"></ui-text-field>
        <ui-text-field size="medium" label="Medium"></ui-text-field>
        <ui-text-field size="large" label="Large"></ui-text-field>
        <ui-text-field disabled label="Disabled"></ui-text-field>
      </div>
      <div class="row">
        <ui-text-field
          required
          minlength="3"
          maxlength="20"
          label="Username"
          placeholder="3-20 characters"
        ></ui-text-field>
      </div>
    </section>

    <section>
      <h2>Textarea</h2>
      <div class="row">
        <ui-textarea label="Comments"></ui-textarea>
      </div>
      <div class="row">
        <ui-textarea size="small" label="Small"></ui-textarea>
        <ui-textarea size="medium" label="Medium"></ui-textarea>
        <ui-textarea size="large" label="Large"></ui-textarea>
        <ui-textarea disabled label="Disabled"></ui-textarea>
      </div>
      <div class="row">
        <ui-textarea
          required
          minlength="10"
          maxlength="200"
          label="Feedback"
          placeholder="10-200 characters"
        ></ui-textarea>
      </div>
      <div class="row">
        <ui-textarea
          autosize
          rows="2"
          resize="none"
          label="Autosize (grows as you type)"
          placeholder="Starts at 2 rows, grows to fit..."
        ></ui-textarea>
      </div>
    </section>

    <section>
      <h2>Number field</h2>
      <div class="row">
        <ui-number-field label="Quantity"></ui-number-field>
      </div>
      <div class="row">
        <ui-number-field size="small" label="Small"></ui-number-field>
        <ui-number-field size="medium" label="Medium"></ui-number-field>
        <ui-number-field size="large" label="Large"></ui-number-field>
        <ui-number-field disabled label="Disabled"></ui-number-field>
      </div>
      <div class="row">
        <ui-number-field
          required
          min="0"
          max="10"
          step="1"
          label="Amount"
          placeholder="0 to 10"
        ></ui-number-field>
      </div>
    </section>

    <section>
      <h2>Password field</h2>
      <div class="row">
        <ui-password-field label="Password"></ui-password-field>
      </div>
      <div class="row">
        <ui-password-field size="small" label="Small"></ui-password-field>
        <ui-password-field size="medium" label="Medium"></ui-password-field>
        <ui-password-field size="large" label="Large"></ui-password-field>
        <ui-password-field disabled label="Disabled"></ui-password-field>
      </div>
      <div class="row">
        <ui-password-field
          required
          minlength="8"
          label="Password"
          placeholder="At least 8 characters"
        ></ui-password-field>
      </div>
    </section>

    <section>
      <h2>Email field</h2>
      <div class="row">
        <ui-email-field
          label="Email address"
          placeholder="you@example.com"
        ></ui-email-field>
      </div>
      <div class="row">
        <ui-email-field size="small" label="Small"></ui-email-field>
        <ui-email-field size="medium" label="Medium"></ui-email-field>
        <ui-email-field size="large" label="Large"></ui-email-field>
        <ui-email-field disabled label="Disabled"></ui-email-field>
      </div>
      <div class="row">
        <ui-email-field required label="Email address"></ui-email-field>
      </div>
    </section>
  `;
}

// Experimental field family (src/uu/) — same visuals as the ui-* input
// fields above, rebuilt on the shared FormControlElement → FieldElement base,
// plus the info-text/error-text message row every field gets from the base.
function uuFieldsTab() {
  return html`
    <section>
      <h2>uu-text-field</h2>
      <div class="row">
        <uu-text-field label="Full name"></uu-text-field>
      </div>
      <div class="row">
        <uu-text-field size="small" label="Small"></uu-text-field>
        <uu-text-field size="medium" label="Medium"></uu-text-field>
        <uu-text-field size="large" label="Large"></uu-text-field>
        <uu-text-field disabled label="Disabled"></uu-text-field>
      </div>
      <div class="row">
        <uu-text-field
          required
          minlength="3"
          maxlength="20"
          label="Username"
          placeholder="3-20 characters"
          info-text="Letters, numbers and dashes only."
        ></uu-text-field>
        <uu-text-field
          label="Card number"
          value="abc"
          error-text="That doesn't look like a card number."
        ></uu-text-field>
        <uu-text-field
          readonly
          label="Account ID"
          value="acct_9f3c1"
          info-text="Read-only — still submitted with the form."
        ></uu-text-field>
      </div>
    </section>

    <section>
      <h2>uu-number-field</h2>
      <div class="row">
        <uu-number-field label="Quantity"></uu-number-field>
        <uu-number-field
          label="Amount"
          min="0"
          max="10"
          step="1"
          value="5"
          info-text="Between 0 and 10."
        ></uu-number-field>
        <uu-number-field
          centered
          hide-stepper
          label="Go to page"
          value="1"
        ></uu-number-field>
        <uu-number-field
          readonly
          label="Seats (read-only)"
          value="4"
        ></uu-number-field>
      </div>
    </section>

    <section>
      <h2>uu-password-field</h2>
      <div class="row">
        <uu-password-field label="Password"></uu-password-field>
        <uu-password-field
          required
          minlength="8"
          label="Password"
          placeholder="At least 8 characters"
          info-text="Use a passphrase you don't use elsewhere."
        ></uu-password-field>
      </div>
    </section>

    <section>
      <h2>uu-email-field</h2>
      <div class="row">
        <uu-email-field
          label="Email address"
          placeholder="you@example.com"
        ></uu-email-field>
        <uu-email-field
          required
          label="Email address"
          value="not-an-email"
        ></uu-email-field>
      </div>
    </section>

    <section>
      <h2>uu-date-field</h2>
      <p>
        Editable text (ISO — <code>YYYY-MM-DD</code>) plus a calendar button;
        ArrowDown in the field also opens the picker.
      </p>
      <div class="row">
        <uu-date-field label="Date"></uu-date-field>
        <uu-date-field
          selection-mode="dateTime"
          label="Date &amp; time"
        ></uu-date-field>
      </div>
      <div class="row">
        <uu-date-field
          required
          min="2026-01-01"
          max="2026-12-31"
          label="Date of birth"
          info-text="Must fall within 2026."
        ></uu-date-field>
        <uu-date-field
          readonly
          value="2026-09-02"
          label="Booked (read-only)"
        ></uu-date-field>
        <uu-date-field disabled label="Disabled"></uu-date-field>
      </div>
    </section>

    <section>
      <h2>uu-select</h2>
      <div class="row">
        <uu-select label="Fruit" placeholder="Pick one">
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="banana">Banana</uu-option>
          <uu-option-group label="Citrus">
            <uu-option value="orange">Orange</uu-option>
            <uu-option value="lemon">Lemon</uu-option>
          </uu-option-group>
          <uu-option value="grape" disabled>Grape (out of stock)</uu-option>
        </uu-select>
        <uu-select size="small" label="Small">
          <uu-option value="a">Option A</uu-option>
          <uu-option value="b">Option B</uu-option>
        </uu-select>
        <uu-select disabled label="Disabled">
          <uu-option value="a">Option A</uu-option>
        </uu-select>
      </div>
      <div class="row">
        <uu-select
          multiple
          max-options-visible="2"
          label="Fruits"
          info-text="Choose as many as you like."
        >
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="banana">Banana</uu-option>
          <uu-option value="orange">Orange</uu-option>
          <uu-option value="lemon">Lemon</uu-option>
        </uu-select>
        <uu-select
          required
          label="Required"
          error-text="Please choose a fruit."
        >
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="banana">Banana</uu-option>
        </uu-select>
      </div>
      <div class="row">
        <uu-select inline label="Fruit (inline)">
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="banana">Banana</uu-option>
          <uu-option value="orange">Orange</uu-option>
        </uu-select>
      </div>
    </section>

    <section>
      <h2>uu-combobox</h2>
      <div class="row">
        <uu-combobox label="Fruit" placeholder="Type to filter…">
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="apricot">Apricot</uu-option>
          <uu-option-group label="Citrus">
            <uu-option value="orange">Orange</uu-option>
            <uu-option value="lemon">Lemon</uu-option>
            <uu-option value="lime">Lime</uu-option>
          </uu-option-group>
          <uu-option value="banana">Banana</uu-option>
        </uu-combobox>
        <uu-combobox
          allow-custom-value
          label="Tag"
          placeholder="Pick or type a new one"
        >
          <uu-option value="bug">Bug</uu-option>
          <uu-option value="feature">Feature</uu-option>
          <uu-option value="chore">Chore</uu-option>
        </uu-combobox>
      </div>
      <div class="row">
        <uu-combobox
          multiple
          max-options-visible="3"
          label="Fruits"
          placeholder="Filter…"
          info-text="Type to narrow, click to add."
        >
          <uu-option value="apple">Apple</uu-option>
          <uu-option value="banana">Banana</uu-option>
          <uu-option value="orange">Orange</uu-option>
          <uu-option value="lemon">Lemon</uu-option>
          <uu-option value="grape">Grape</uu-option>
        </uu-combobox>
        <uu-combobox size="small" label="Small">
          <uu-option value="a">Alpha</uu-option>
          <uu-option value="b">Beta</uu-option>
        </uu-combobox>
      </div>
    </section>

    <section>
      <h2>uu-autocomplete</h2>
      <div class="row">
        <uu-autocomplete
          label="Fruit"
          placeholder="Search fruits…"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></uu-autocomplete>
        <uu-autocomplete
          multiple
          label="Fruits"
          placeholder="Search fruits…"
          info-text="Server-backed (simulated 1s latency)."
          .dataSource=${localFilter(FRUITS, 1000)}
        ></uu-autocomplete>
      </div>
      <div class="row">
        <uu-autocomplete
          size="small"
          label="Small"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></uu-autocomplete>
      </div>
    </section>
  `;
}

function nativeDateFieldTab() {
  return html`
    <section>
      <h2>Native date field</h2>
      <p>Thin themed wrapper around the browser's own native date picker.</p>
      <div class="row">
        <ui-native-date-field label="Date"></ui-native-date-field>
      </div>
      <div class="row">
        <ui-native-date-field
          type="datetime-local"
          label="Date &amp; time"
        ></ui-native-date-field>
      </div>
      <div class="row">
        <ui-native-date-field size="small" label="Small"></ui-native-date-field>
        <ui-native-date-field
          size="medium"
          label="Medium"
        ></ui-native-date-field>
        <ui-native-date-field size="large" label="Large"></ui-native-date-field>
        <ui-native-date-field disabled label="Disabled"></ui-native-date-field>
      </div>
      <div class="row">
        <ui-native-date-field
          required
          min="2026-01-01"
          max="2026-12-31"
          label="Date of birth"
        ></ui-native-date-field>
      </div>
    </section>
  `;
}

// -------------------------------------------------------------------
// Date Fields page — one ui-date-field per selection mode, all sharing a
// Locale selector so the same stored values can be seen reformatted. Adapted
// from the field's own upstream demo, with Shoelace's sl-select/sl-option and
// sx-fieldset swapped for this library's equivalents.
// -------------------------------------------------------------------

// Module-level, like uiScale/uiLocale above — this file re-renders the whole
// page on change.
let dateFieldsLocale = "en-US";

// The raw (unformatted) value each field last reported, keyed by mode, so the
// page can show what's actually stored next to the formatted display.
const dateFieldValues: Record<string, string> = {};

const DATE_FIELD_LOCALES = [
  "en-US",
  "en-GB",
  "es-ES",
  "fr-FR",
  "de-DE",
  "it-IT",
];

interface DateFieldDemo {
  mode: DateFieldSelectionMode;
  label: string;
  placeholder: string;
  minuteStep?: number;
  weekNumbers?: boolean;
  highlightWeekends?: boolean;
  centuryView?: boolean;
}

const DATE_FIELD_DEMOS: DateFieldDemo[] = [
  {
    mode: "date",
    label: "Date",
    placeholder: "Pick a date",
    weekNumbers: true,
    highlightWeekends: true,
  },
  {
    mode: "dateTime",
    label: "Date and time",
    placeholder: "Pick a date and time",
    minuteStep: 15,
  },
  {
    mode: "dateRange",
    label: "Date range",
    placeholder: "Pick a date range",
    highlightWeekends: true,
  },
  {
    mode: "dateTimeRange",
    label: "Date time range",
    placeholder: "Pick a range",
  },
  { mode: "time", label: "Time", placeholder: "Pick a time", minuteStep: 5 },
  { mode: "timeRange", label: "Time range", placeholder: "Pick a time range" },
  {
    mode: "week",
    label: "Week",
    placeholder: "Pick a week",
    weekNumbers: true,
  },
  {
    mode: "weekRange",
    label: "Week range",
    placeholder: "Pick a week range",
    weekNumbers: true,
  },
  { mode: "month", label: "Month", placeholder: "Pick a month" },
  {
    mode: "monthRange",
    label: "Month range",
    placeholder: "Pick a month range",
  },
  { mode: "quarter", label: "Quarter", placeholder: "Pick a quarter" },
  {
    mode: "quarterRange",
    label: "Quarter range",
    placeholder: "Pick a quarter range",
  },
  {
    mode: "year",
    label: "Year",
    placeholder: "Pick a year",
    centuryView: true,
  },
  {
    mode: "yearRange",
    label: "Year range",
    placeholder: "Pick a year range",
    centuryView: true,
  },
];

function dateFieldsTab() {
  return html`
    <section>
      <h2>Date field</h2>
      <p>
        <code>ui-date-field</code> — a read-only formatted display plus a picker
        popup, built on <code>ui-date-picker</code> and so on that component's
        framework-free core. One field covers every single and range selection
        mode the picker offers: day, date+time, week, month, quarter, year, and
        a range of each.
      </p>
      <p>
        <code>value</code> stays the picker's own raw, locale-independent string
        (<code>2026-08-01</code>, <code>2026-W32</code>, <code>2026-Q3</code>,
        <code>2026-08-01,2026-08-09</code>, …) — that's what a form submits. The
        text you see is that value run through <code>Intl</code> for the field's
        language, so switching Locale below reformats every field in place
        without touching what's stored. The popup commits on
        <strong>OK</strong>, so picking the second half of a range never churns
        the field through a half-selected state.
      </p>
      <div class="date-fields-locale">
        <ui-select
          label="Locale"
          size="small"
          .value=${dateFieldsLocale}
          @change=${(event: Event) => {
            dateFieldsLocale = (event.currentTarget as Select).value;
            renderApp();
          }}
        >
          ${DATE_FIELD_LOCALES.map(
            (locale) => html`<ui-option value=${locale}>${locale}</ui-option>`,
          )}
        </ui-select>
      </div>
      <div class="date-fields-grid" lang=${dateFieldsLocale}>
        ${DATE_FIELD_DEMOS.map(
          (demo) => html`
            <div class="date-fields-cell">
              <ui-date-field
                label=${demo.label}
                selection-mode=${demo.mode}
                placeholder=${demo.placeholder}
                highlight-current
                ?show-week-numbers=${demo.weekNumbers ?? false}
                ?highlight-weekends=${demo.highlightWeekends ?? false}
                ?enable-century-view=${demo.centuryView ?? false}
                minute-step=${demo.minuteStep ?? 1}
                @change=${(event: Event) => {
                  dateFieldValues[demo.mode] = (
                    event.currentTarget as DateField
                  ).value;
                  renderApp();
                }}
              ></ui-date-field>
              <p class="date-fields-raw">
                <code>${dateFieldValues[demo.mode] || "\u2014"}</code>
              </p>
            </div>
          `,
        )}
      </div>
    </section>

    <section>
      <h2>States</h2>
      <p>
        Sizes, and the usual field states. <code>required</code> reports
        <code>valueMissing</code> through <code>ElementInternals</code> like
        every other field here; <code>min</code>/<code>max</code> additionally
        report range under/overflow, but only in <code>date</code> mode — for a
        week or a quarter there is no meaningful string comparison against a
        <code>yyyy-mm-dd</code> bound (the picker still greys out the
        out-of-range cells in every mode).
      </p>
      <div class="row">
        <ui-date-field size="small" label="Small"></ui-date-field>
        <ui-date-field size="medium" label="Medium"></ui-date-field>
        <ui-date-field size="large" label="Large"></ui-date-field>
      </div>
      <div class="row">
        <ui-date-field disabled label="Disabled"></ui-date-field>
        <ui-date-field
          readonly
          value="2026-08-01"
          label="Read-only"
        ></ui-date-field>
        <ui-date-field required label="Required"></ui-date-field>
      </div>
      <div class="row">
        <ui-date-field
          label="Bounded to 2026"
          min="2026-01-01"
          max="2026-12-31"
          value="2026-08-01"
        ></ui-date-field>
        <ui-date-field
          label="Weekends disabled"
          disable-weekends
          highlight-weekends
        ></ui-date-field>
      </div>
    </section>
  `;
}

// Fakes an upload for the ui-upload demos below: whenever the component fires
// upload-request (immediately per file in auto mode, or on demand — a row's
// own Start/Retry button or "Upload all" — in manual mode), ramps that file's
// progress up over ~1.5s, then marks it done. A real integration would drive
// setFileProgress from an actual fetch/XHR upload-progress handler instead —
// ui-upload itself never touches the network, it only tells the caller when
// to start.
function simulateUpload(event: CustomEvent<UploadRequestDetail>) {
  const upload = event.currentTarget as Upload;
  const { file } = event.detail;

  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(100, progress + 20);
    upload.setFileProgress(file, progress);
    if (progress >= 100) {
      clearInterval(timer);
      upload.setFileDone(file);
    }
  }, 300);
}

function tabsTab() {
  return html`
    <section>
      <h2>Tabs</h2>
      <div class="row">
        <ui-tabs value="account" style="width: 100%">
          <ui-tab value="account">Account</ui-tab>
          <ui-tab value="security">Security</ui-tab>
          <ui-tab value="billing" disabled>Billing</ui-tab>

          <ui-tab-panel slot="panel" value="account">
            <p>Account settings — name, email, avatar.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="security">
            <p>Security settings — password, two-factor authentication.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="billing">
            <p>Billing — unavailable on the free plan.</p>
          </ui-tab-panel>
        </ui-tabs>
      </div>
    </section>

    <section>
      <h2>Tabs (horizontal, right-aligned)</h2>
      <div class="row">
        <ui-tabs tab-align="end" value="account" style="width: 100%">
          <ui-tab value="account">Account</ui-tab>
          <ui-tab value="security">Security</ui-tab>
          <ui-tab value="billing" disabled>Billing</ui-tab>

          <ui-tab-panel slot="panel" value="account">
            <p>Account settings — name, email, avatar.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="security">
            <p>Security settings — password, two-factor authentication.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="billing">
            <p>Billing — unavailable on the free plan.</p>
          </ui-tab-panel>
        </ui-tabs>
      </div>
    </section>

    <section>
      <h2>Tabs (vertical)</h2>
      <div class="row">
        <ui-tabs orientation="vertical" value="profile" style="width: 100%">
          <ui-tab value="profile">Profile</ui-tab>
          <ui-tab value="notifications">Notifications</ui-tab>
          <ui-tab value="integrations">Integrations</ui-tab>

          <ui-tab-panel slot="panel" value="profile">
            <p>Profile — display name, bio, avatar.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="notifications">
            <p>Notifications — email digests, push alerts.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="integrations">
            <p>Integrations — connected apps and API keys.</p>
          </ui-tab-panel>
        </ui-tabs>
      </div>
    </section>

    <section>
      <h2>Tabs (vertical, left-aligned)</h2>
      <div class="row">
        <ui-tabs
          orientation="vertical"
          tab-align="start"
          value="profile"
          style="width: 100%"
        >
          <ui-tab value="profile">Profile</ui-tab>
          <ui-tab value="notifications">Notifications</ui-tab>
          <ui-tab value="integrations">Integrations</ui-tab>

          <ui-tab-panel slot="panel" value="profile">
            <p>Profile — display name, bio, avatar.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="notifications">
            <p>Notifications — email digests, push alerts.</p>
          </ui-tab-panel>
          <ui-tab-panel slot="panel" value="integrations">
            <p>Integrations — connected apps and API keys.</p>
          </ui-tab-panel>
        </ui-tabs>
      </div>
    </section>
  `;
}

function uploadTab() {
  return html`
    <section>
      <h2>Upload</h2>
      <p>
        Files ride along in the enclosing form's <code>FormData</code>, same as
        a native <code>&lt;input type="file"&gt;</code> — no network calls
        happen inside the component itself.
        <code>setFileProgress</code>/<code>setFileDone</code>/<code
          >setFileError</code
        >
        let a caller running its own upload drive the progress UI per file,
        started via the <code>upload-request</code> event (simulated below).
      </p>
      <p>
        Auto-start (default): each file fires <code>upload-request</code> as
        soon as it's added.
      </p>
      <div class="row">
        <ui-upload
          name="attachments"
          multiple
          accept="image/*,.pdf"
          max-files="5"
          max-file-size="5242880"
          @upload-request=${simulateUpload}
          @file-reject=${(event: CustomEvent<UploadFileRejectDetail>) =>
            console.log(
              "Rejected:",
              event.detail.file.name,
              event.detail.reason,
            )}
        ></ui-upload>
      </div>
      <p>
        Manual: files wait until Start/Retry (per row) or "Upload all" is
        clicked.
      </p>
      <div class="row">
        <ui-upload
          name="manual-attachments"
          multiple
          manual
          @upload-request=${simulateUpload}
        ></ui-upload>
      </div>
      <div class="row">
        <ui-upload name="single-file"></ui-upload>
      </div>
      <div class="row">
        <ui-upload size="small" name="small"></ui-upload>
        <ui-upload size="medium" name="medium"></ui-upload>
        <ui-upload size="large" name="large"></ui-upload>
        <ui-upload disabled name="disabled"></ui-upload>
      </div>
      <div class="row">
        <ui-upload required name="required"></ui-upload>
      </div>
    </section>
  `;
}

// Renders FRUITS as real <ui-option>/<ui-option-group> children — each call
// produces a fresh set of elements, so it's safe to use once per <ui-combobox>
// below rather than sharing a single set of slotted nodes across two hosts.
const fruitOptions = () =>
  FRUITS.map(
    (group) => html`
      <ui-option-group label=${group.label ?? ""}>
        ${group.items.map(
          (item) =>
            html`<ui-option value=${item.toLowerCase()}>${item}</ui-option>`,
        )}
      </ui-option-group>
    `,
  );

function selectionTab() {
  return html`
    <section>
      <h2>Select</h2>
      <div class="row">
        <ui-select label="Fruit">
          <ui-option value="apple">Apple</ui-option>
          <ui-option value="banana">Banana</ui-option>
          <ui-option-group label="Citrus">
            <ui-option value="orange">Orange</ui-option>
            <ui-option value="lemon">Lemon</ui-option>
            <ui-option value="lime">Lime</ui-option>
          </ui-option-group>
          <ui-option value="grape" disabled>Grape (out of stock)</ui-option>
        </ui-select>
      </div>
      <div class="row">
        <ui-select size="small" label="Small">
          <ui-option value="a">Option A</ui-option>
          <ui-option value="b">Option B</ui-option>
        </ui-select>
        <ui-select size="medium" label="Medium">
          <ui-option value="a">Option A</ui-option>
          <ui-option value="b">Option B</ui-option>
        </ui-select>
        <ui-select size="large" label="Large">
          <ui-option value="a">Option A</ui-option>
          <ui-option value="b">Option B</ui-option>
        </ui-select>
        <ui-select disabled label="Disabled">
          <ui-option value="a">Option A</ui-option>
        </ui-select>
      </div>
      <div class="row">
        <ui-select multiple max-options-visible="2" label="Fruits">
          <ui-option value="apple">Apple</ui-option>
          <ui-option value="banana">Banana</ui-option>
          <ui-option-group label="Citrus">
            <ui-option value="orange">Orange</ui-option>
            <ui-option value="lemon">Lemon</ui-option>
            <ui-option value="lime">Lime</ui-option>
          </ui-option-group>
          <ui-option value="grape" disabled>Grape (out of stock)</ui-option>
        </ui-select>
      </div>
      <div class="row">
        <ui-select
          multiple
          multiple-value-display="text"
          label="Fruits (text display)"
        >
          <ui-option value="apple">Apple</ui-option>
          <ui-option value="banana">Banana</ui-option>
          <ui-option-group label="Citrus">
            <ui-option value="orange">Orange</ui-option>
            <ui-option value="lemon">Lemon</ui-option>
            <ui-option value="lime">Lime</ui-option>
          </ui-option-group>
          <ui-option value="grape" disabled>Grape (out of stock)</ui-option>
        </ui-select>
      </div>
      <div class="row">
        <ui-select inline label="Fruit (inline)">
          <ui-option value="apple">Apple</ui-option>
          <ui-option value="banana">Banana</ui-option>
          <ui-option-group label="Citrus">
            <ui-option value="orange">Orange</ui-option>
            <ui-option value="lemon">Lemon</ui-option>
            <ui-option value="lime">Lime</ui-option>
          </ui-option-group>
          <ui-option value="grape" disabled>Grape (out of stock)</ui-option>
        </ui-select>
      </div>
    </section>

    <section>
      <h2>Combobox</h2>
      <div class="row">
        <ui-combobox class="combobox-demo" label="Fruit">
          ${fruitOptions()}
        </ui-combobox>
      </div>
      <div class="row">
        <ui-combobox class="combobox-demo" size="small" label="Small">
          ${fruitOptions()}
        </ui-combobox>
        <ui-combobox class="combobox-demo" size="medium" label="Medium">
          ${fruitOptions()}
        </ui-combobox>
        <ui-combobox class="combobox-demo" size="large" label="Large">
          ${fruitOptions()}
        </ui-combobox>
      </div>
      <div class="row">
        <ui-combobox class="combobox-demo" multiple label="Fruits">
          ${fruitOptions()}
        </ui-combobox>
      </div>
    </section>

    <section>
      <h2>Autocomplete</h2>
      <div class="row">
        <ui-autocomplete
          class="combobox-demo"
          label="Fruit"
          placeholder="Search fruits…"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></ui-autocomplete>
      </div>
      <div class="row">
        <ui-autocomplete
          class="combobox-demo"
          size="small"
          label="Small"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></ui-autocomplete>
        <ui-autocomplete
          class="combobox-demo"
          size="medium"
          label="Medium"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></ui-autocomplete>
        <ui-autocomplete
          class="combobox-demo"
          size="large"
          label="Large"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></ui-autocomplete>
      </div>
      <div class="row">
        <ui-autocomplete
          class="combobox-demo"
          multiple
          label="Fruits"
          placeholder="Search fruits…"
          .dataSource=${localFilter(FRUITS, 1000)}
        ></ui-autocomplete>
      </div>
    </section>
  `;
}

function dataGridFlatTab() {
  return html`
    <section>
      <h2>Datagrid</h2>
      <ui-datagrid
        heading="Employees"
        subheading="All employees across every department"
        .columns=${employeeDataGridColumnsFlat}
        .dataSource=${employeeDataGridDataSource}
        .actions=${employeeDataGridActions}
        .rowDetails=${employeeRowDetails}
        .rowActions=${employeeRowActions}
        .pageSizeOptions=${[50, 100, 150, 250, 500]}
        page-size="50"
        selection-mode="multi"
        selection-tone="primary"
        @row-selection-change=${(
          event: CustomEvent<{ selected: Employee[] }>,
        ) =>
          console.log(
            "Selected:",
            event.detail.selected.map((employee) => employee.name),
          )}
      ></ui-datagrid>
    </section>
  `;
}

function dataGridGroupedTab() {
  return html`
    <section>
      <h2>Datagrid</h2>
      <ui-datagrid
        heading="Employees"
        subheading="All employees across every department"
        .columns=${employeeDataGridColumns}
        .dataSource=${employeeDataGridDataSource}
        .actions=${employeeDataGridActions}
        .rowDetails=${employeeRowDetails}
        .rowActions=${employeeRowActions}
        .pageSizeOptions=${[50, 100, 150, 250, 500]}
        page-size="50"
        selection-mode="multi"
        selection-tone="primary"
        stripes
        @row-selection-change=${(
          event: CustomEvent<{ selected: Employee[] }>,
        ) =>
          console.log(
            "Selected:",
            event.detail.selected.map((employee) => employee.name),
          )}
      ></ui-datagrid>
    </section>
  `;
}

// -------------------------------------------------------------------
// Date Picker page — one live picker driven by a panel of controls, so every
// selection mode and option can be exercised against the same instance
// (rather than a grid of fixed configurations). Adapted from the picker's own
// upstream demo, with Shoelace's sl-select/sl-option/sl-checkbox swapped for
// this library's equivalents and its --sl-* tokens for --ui-*.
// -------------------------------------------------------------------

// Module-level, like uiScale/uiLocale above — this file re-renders the whole
// page on change, so there's nowhere per-component to keep it.
const pickerDemo = {
  locale: "en-US",
  // What the picker last reported through `value`.
  selection: "",
  selectionMode: "date" as DatePickerSelectionMode,
  calendarSize: "default" as "default" | "minimal" | "maximal",
  accentuateHeader: true,
  highlightCurrent: true,
  highlightWeekends: true,
  disableWeekends: false,
  showWeekNumbers: true,
  enableCenturyView: false,
  minuteStep: 15,
  // ISO yyyy-mm-dd, straight from the two ui-date-fields below.
  minDate: "",
  maxDate: "",
};

// Local midnight, not `new Date(iso)` — the date-only form is parsed as UTC,
// which in a negative-offset zone lands on the previous local day and would
// shift the bound the picker is given by one. Same reasoning as
// ui-date-field's own parseIsoDate.
function isoToLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// The four day-grid options only mean anything in a mode whose sheet is
// actually made of days — a month/quarter/year sheet has no weekends to
// highlight and no week numbers to show. ("weekRange" is included here; the
// upstream demo's own list omitted it, which looks like an oversight given
// "week"/"weeks" are both in.)
const DAY_BASED_MODES: DatePickerSelectionMode[] = [
  "date",
  "dates",
  "dateTime",
  "dateRange",
  "dateTimeRange",
  "week",
  "weeks",
  "weekRange",
];

const PICKER_SELECTION_MODES: DatePickerSelectionMode[] = [
  "date",
  "dates",
  "dateTime",
  "dateRange",
  "dateTimeRange",
  "time",
  "timeRange",
  "week",
  "weeks",
  "weekRange",
  "month",
  "months",
  "monthRange",
  "quarter",
  "quarters",
  "quarterRange",
  "year",
  "years",
  "yearRange",
];

// Divisors of 60 (so the grid is even across the hour), plus 60 itself, plus
// one deliberately invalid entry to show the fallback: anything outside 1-60
// leaves the minute column offering 00 alone.
const PICKER_MINUTE_STEPS = [
  { value: 1, label: "1 — every minute" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 15, label: "15 — quarter hours" },
  { value: 30, label: "30" },
  { value: 60, label: "60 — on the hour" },
  { value: 120, label: "120 — invalid, falls back to 00" },
];

const PICKER_LOCALES = [
  "en-US",
  "en-GB",
  "en-GB-u-hc-h12",
  "es-ES",
  "fr-FR",
  "de-DE",
  "de-AT",
  "de-CH",
  "it-IT",
  "ar-SA",
];

const PICKER_CALENDAR_SIZES: {
  value: "default" | "minimal" | "maximal";
  label: string;
}[] = [
  { value: "default", label: "default — show adjacent days/years/decades" },
  { value: "minimal", label: "minimal — hide adjacent days/years/decades" },
  { value: "maximal", label: "maximal — always show 42 days in month view" },
];

// Each toggle writes one field and re-renders the page. Typed per control
// rather than the upstream demo's `data-subject` string dispatch, which wrote
// through a computed `Object.assign` key and so type-checked nothing.
type PickerToggle =
  | "accentuateHeader"
  | "highlightCurrent"
  | "highlightWeekends"
  | "disableWeekends"
  | "showWeekNumbers"
  | "enableCenturyView";

function renderPickerToggle(field: PickerToggle, label: string) {
  return html`
    <ui-checkbox
      ?checked=${pickerDemo[field]}
      @change=${(event: Event) => {
        pickerDemo[field] = (event.currentTarget as Checkbox).checked;
        renderApp();
      }}
    >
      ${label}
    </ui-checkbox>
  `;
}

function datePickerTab() {
  return html`
    <section>
      <h2>Date Picker</h2>
      <p>
        <code>ui-date-picker</code> is built on a
        <strong>framework-free core</strong> (<code>vanilla/</code>): its own
        small virtual DOM, a <code>Calendar</code> interface with a Gregorian
        implementation behind it, and a plain CSS string. The Lit wrapper only
        owns the custom element and maps the core's <code>--cal-*</code> tokens
        onto this library's theme — which is why the picker follows the Theme
        switcher above without a single dark-specific rule of its own.
      </p>
      <p>
        Drill into the header to move month → year → decade (→ century, if
        enabled). The two date fields at the bottom of the panel are
        <code>ui-date-field</code>, itself built on this same picker.
      </p>
      <div class="picker-demo">
        <div class="picker-demo-main">
          <ui-date-picker
            class="picker-demo-picker"
            lang=${pickerDemo.locale}
            dir=${pickerDemo.locale === "ar-SA" ? "rtl" : "ltr"}
            selection-mode=${pickerDemo.selectionMode}
            calendar-size=${pickerDemo.calendarSize}
            ?accentuate-header=${pickerDemo.accentuateHeader}
            ?highlight-current=${pickerDemo.highlightCurrent}
            ?highlight-weekends=${pickerDemo.highlightWeekends}
            ?disable-weekends=${pickerDemo.disableWeekends}
            ?show-week-numbers=${pickerDemo.showWeekNumbers}
            ?enable-century-view=${pickerDemo.enableCenturyView}
            minute-step=${pickerDemo.minuteStep}
            .minDate=${isoToLocalDate(pickerDemo.minDate)}
            .maxDate=${isoToLocalDate(pickerDemo.maxDate)}
            @change=${(event: Event) => {
              pickerDemo.selection = (event.currentTarget as DatePicker).value;
              renderApp();
            }}
          ></ui-date-picker>
          <p class="picker-demo-selection">
            <code>value</code>:
            <strong>
              ${
                pickerDemo.selection.replaceAll(",", ", ") ||
                "(nothing selected)"
              }
            </strong>
          </p>
        </div>
        <div class="picker-demo-controls">
          <ui-select
            label="Locale"
            .value=${pickerDemo.locale}
            @change=${(event: Event) => {
              pickerDemo.locale = (event.currentTarget as Select).value;
              renderApp();
            }}
          >
            ${PICKER_LOCALES.map(
              (locale) =>
                html`<ui-option value=${locale}>${locale}</ui-option>`,
            )}
          </ui-select>
          <ui-select
            label="Selection mode"
            .value=${pickerDemo.selectionMode}
            @change=${(event: Event) => {
              pickerDemo.selectionMode = (event.currentTarget as Select)
                .value as DatePickerSelectionMode;
              renderApp();
            }}
          >
            ${PICKER_SELECTION_MODES.map(
              (mode) => html`<ui-option value=${mode}>${mode}</ui-option>`,
            )}
          </ui-select>
          <ui-select
            label="Calendar size"
            .value=${pickerDemo.calendarSize}
            @change=${(event: Event) => {
              pickerDemo.calendarSize = (event.currentTarget as Select)
                .value as "default" | "minimal" | "maximal";
              renderApp();
            }}
          >
            ${PICKER_CALENDAR_SIZES.map(
              (size) =>
                html`<ui-option value=${size.value}>${size.label}</ui-option>`,
            )}
          </ui-select>
          <ui-select
            label="Minute step"
            .value=${String(pickerDemo.minuteStep)}
            @change=${(event: Event) => {
              pickerDemo.minuteStep = Number(
                (event.currentTarget as Select).value,
              );
              renderApp();
            }}
          >
            ${PICKER_MINUTE_STEPS.map(
              (step) =>
                html`<ui-option value=${String(step.value)}>
                  ${step.label}
                </ui-option>`,
            )}
          </ui-select>
          ${renderPickerToggle("accentuateHeader", "accentuate header")}
          ${
            DAY_BASED_MODES.includes(pickerDemo.selectionMode)
              ? html`
                  ${renderPickerToggle("highlightCurrent", "highlight current")}
                  ${renderPickerToggle("highlightWeekends", "highlight weekends")}
                  ${renderPickerToggle("disableWeekends", "disable weekends")}
                  ${renderPickerToggle("showWeekNumbers", "show week numbers")}
                `
              : nothing
          }
          ${renderPickerToggle("enableCenturyView", "enable century view")}
          <div class="picker-demo-range">
            <ui-date-field
              size="small"
              label="Min. date"
              .value=${pickerDemo.minDate}
              @change=${(event: Event) => {
                pickerDemo.minDate = (event.currentTarget as DateField).value;
                renderApp();
              }}
            ></ui-date-field>
            <ui-date-field
              size="small"
              label="Max. date"
              .value=${pickerDemo.maxDate}
              @change=${(event: Event) => {
                pickerDemo.maxDate = (event.currentTarget as DateField).value;
                renderApp();
              }}
            ></ui-date-field>
          </div>
        </div>
      </div>
    </section>
  `;
}

// -------------------------------------------------------------------
// Tabs — each subdemo lives on its own page, switched via the vertical tab
// list rendered alongside the content (see renderApp() below).
// -------------------------------------------------------------------

// Named DemoPage (not Tab) to keep it visually distinct from the actual
// <ui-tab>/<ui-tabs> components below, now that this file both defines this
// plain data shape *and* renders real tab elements from it.
interface DemoPage {
  id: string;
  label: string;
  content: () => unknown;
}

const demoPages: DemoPage[] = [
  { id: "typography", label: "Typography", content: typographyTab },
  { id: "buttons", label: "Buttons", content: buttonsTab },
  { id: "selection", label: "Selection", content: selectionTab },
  {
    id: "radios-and-checkboxes",
    label: "Radio/Checkboxes",
    content: radiosAndCheckboxesTab,
  },
  { id: "input-fields", label: "Input Fields", content: inputFieldsTab },
  { id: "uu-fields", label: "uu-* Fields", content: uuFieldsTab },
  { id: "date-picker", label: "Date Picker", content: datePickerTab },
  { id: "date-fields", label: "Date Fields", content: dateFieldsTab },
  {
    id: "native-date-field",
    label: "Native Date Field",
    content: nativeDateFieldTab,
  },
  { id: "upload", label: "Upload", content: uploadTab },
  { id: "tabs", label: "Tabs", content: tabsTab },
  {
    id: "datagrid-flat",
    label: "Datagrid 1",
    content: dataGridFlatTab,
  },
  {
    id: "datagrid-grouped",
    label: "Datagrid 2",
    content: dataGridGroupedTab,
  },
];

// The active page is driven by the URL hash (e.g. #combobox) rather than
// local state, so a reload — or a shared/bookmarked link — lands back on
// the same page instead of always resetting to the first one.
function readPageFromHash(): string {
  const id = location.hash.slice(1);
  return demoPages.some((page) => page.id === id) ? id : demoPages[0].id;
}

let activePageId: string = readPageFromHash();

function activatePage(id: string): void {
  location.hash = id;
}

window.addEventListener("hashchange", () => {
  activePageId = readPageFromHash();
  renderApp();
});

// Not fed back through --ui-scale/lang themselves (reading a live CSS
// custom property, or the attribute this demo itself just set, back out is
// unnecessary indirection) — this is the demo's own record of what it last
// set, so re-renders (e.g. on tab switch) keep both <ui-select>s showing
// the chosen value instead of snapping back to their defaults.
let uiScale = "1";
let uiLocale = "en-US";
// The `color-scheme` value the Theme picker last wrote to <html> — the two
// keywords together mean "follow the OS", which is also what the adopted
// theme's own :root rule says, so this starts out matching it. Held as the
// literal CSS value rather than a light/dark/system enum: it *is* what gets
// assigned, and there's nothing else to derive.
let uiColorScheme = "light dark";

function renderApp(): void {
  render(
    html`
      <main class="page">
        <header>
          <ui-heading level="1" class="page-title">Component demo</ui-heading>
          <div class="header-controls">
            <ui-select
              class="scale-control"
              label="Scale"
              size="small"
              .value=${uiScale}
              @change=${(event: Event) => {
                uiScale = (event.currentTarget as Select).value;
                document.documentElement.style.setProperty(
                  "--ui-scale",
                  uiScale,
                );
              }}
            >
              <ui-option value="0.75">75%</ui-option>
              <ui-option value="0.9">90%</ui-option>
              <ui-option value="1">100%</ui-option>
              <ui-option value="1.1">110%</ui-option>
              <ui-option value="1.25">125%</ui-option>
              <ui-option value="1.5">150%</ui-option>
            </ui-select>
            <ui-select
              class="locale-control"
              label="Locale"
              size="small"
              .value=${uiLocale}
              @change=${(event: Event) => {
                uiLocale = (event.currentTarget as Select).value;
                // Only the html root's lang attribute, nothing else yet —
                // no component in this library reads it today, this is
                // just wiring the demo control ahead of that landing.
                document.documentElement.lang = uiLocale;
              }}
            >
              <ui-option value="en-US">en-US</ui-option>
              <ui-option value="de-DE">de-DE</ui-option>
            </ui-select>
            <ui-select
              class="theme-control"
              label="Theme"
              size="small"
              .value=${uiColorScheme}
              @change=${(event: Event) => {
                uiColorScheme = (event.currentTarget as Select).value;
                // An inline style on <html>, which outranks the `color-scheme:
                // light dark` the adopted theme declares on :root. This is the
                // whole switch — no token is overridden and nothing is
                // re-rendered, because every --ui-* color is a light-dark()
                // pair resolved against this property (see theme.ts).
                document.documentElement.style.colorScheme = uiColorScheme;
              }}
            >
              <ui-option value="light dark">System</ui-option>
              <ui-option value="light">Light</ui-option>
              <ui-option value="dark">Dark</ui-option>
            </ui-select>
          </div>
        </header>
        <ui-tabs
          orientation="vertical"
          .value=${activePageId}
          @change=${(event: Event) => {
            // change bubbles, so a nested <ui-tabs> inside a demo page's own
            // content (see the Tabs demo page) would otherwise be mistaken
            // for this outer nav's own change.
            if (event.target === event.currentTarget) {
              activatePage((event.currentTarget as Tabs).value);
            }
          }}
        >
          ${demoPages.map(
            (page) => html`<ui-tab value=${page.id}>${page.label}</ui-tab>`,
          )}
          ${demoPages.map(
            (page) => html`
              <ui-tab-panel slot="panel" value=${page.id}>
                ${page.id === activePageId ? page.content() : nothing}
              </ui-tab-panel>
            `,
          )}
        </ui-tabs>
      </main>
    `,
    document.getElementById("app")!,
  );
}

renderApp();
