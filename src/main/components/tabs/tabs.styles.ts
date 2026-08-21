import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const tabsStyles = [
  defaultTheme,
  css`
    :host {
      display: flex;
      flex-direction: column;
      font-weight: var(--ui-font-weight-normal);
      font-family: var(--ui-font-sans);
      font-size: var(--ui-font-size-md);
      color: var(--ui-text);
    }

    :host([orientation="vertical"]) {
      flex-direction: row;
    }

    .tablist {
      display: flex;
      flex: none;
      gap: var(--ui-spacing-sm);
      border-bottom: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* Horizontal tabs are each sized to their own content rather than
       sharing one stretched width (unlike vertical, see below), so
       tab-align has nothing per-tab to shift here — instead it pushes the
       whole row to one side of the tablist's own box (see tabAlign's own
       doc comment in tabs.ts). Only present as an attribute when explicitly
       set (tabAlign is null by default), so the unset case is just the
       plain flex initial (flex-start) — today's existing left-packed look,
       unchanged. */
    :host([orientation="horizontal"][tab-align="start"]) .tablist {
      justify-content: flex-start;
    }

    :host([orientation="horizontal"][tab-align="end"]) .tablist {
      justify-content: flex-end;
    }

    :host([orientation="vertical"]) .tablist {
      flex-direction: column;
      align-items: stretch;
      border-bottom: none;
      /* Tighter than the horizontal row's --ui-spacing-sm (4px): stacked
         full-width strips with their own hover/selected backgrounds read as
         one list, so they want a hairline between them rather than the
         visible separation that reads correctly between content-width tabs
         sitting side by side. Still multiplied by --ui-scale, so it tracks
         the density dial like every other metric. */
      gap: calc(2px * var(--ui-scale));
      /* No padding-inline-end here (unlike the gap-to-content on .panels
         below) — the divider must sit flush against each tab's own right
         edge, so a selected tab's accent (its own border-inline-end, see
         tab.styles.ts) lands right on top of this line, same as the
         horizontal case's border-bottom pairing. */
      border-inline-end: var(--ui-border-thin) solid var(--ui-color-neutral-200);
    }

    /* min-width/min-height: 0 — a flex item's default min-size is the size
       of its own content, which for a wide/tall panel would otherwise
       refuse to shrink below that and overflow the tabs component's own
       box rather than scrolling/wrapping inside .panels. */
    .panels {
      flex: 1;
      min-width: 0;
      min-height: 0;
      padding-block-start: var(--ui-spacing-md);
    }

    :host([orientation="vertical"]) .panels {
      padding-block-start: 0;
      /* Not shrunk to --ui-spacing-sm like the horizontal case's
         padding-block-start above — that one only needs to clear a hairline
         divider, but this is a real reading margin between the content and
         a whole sidebar of tab labels, and wants more room than that. */
      padding-inline-start: var(--ui-spacing-lg);
    }
  `,
];
