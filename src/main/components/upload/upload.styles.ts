import { css } from "lit";

import { defaultTheme } from "../../themes/theme.js";

export const uploadStyles = [
  defaultTheme,
  css`
    :host {
      font-weight: var(--ui-font-weight-normal);
      display: block;
      font-family: var(--ui-font-sans);
      color: var(--ui-text);

      /* size="medium" (the default). */
      font-size: var(--field-font-size);
      --field-font-size: var(--ui-font-size-md);
      --field-padding: var(--ui-spacing-md);
    }

    :host([size="small"]) {
      --field-font-size: var(--ui-font-size-sm);
      --field-padding: var(--ui-spacing-sm);
    }

    :host([size="large"]) {
      --field-font-size: var(--ui-font-size-lg);
      --field-padding: var(--ui-spacing-lg);
    }

    .upload {
      display: flex;
      flex-direction: column;
      gap: var(--ui-spacing-sm);
    }

    .dropzone {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--ui-spacing-sm);
      box-sizing: border-box;
      padding: var(--field-padding);
      border: var(--ui-border-thin) dashed var(--ui-color-neutral-400);
      border-radius: var(--ui-radius-md);
      background: var(--ui-color-neutral-50);
      color: var(--ui-color-neutral-700);
      text-align: center;
      cursor: pointer;
      transition:
        border-color 120ms ease,
        background-color 120ms ease;
    }

    .dropzone:hover {
      border-color: var(--ui-color-primary-400);
    }

    .dropzone.dragover {
      border-color: var(--ui-color-primary-500);
      background: var(--ui-color-primary-50);
      color: var(--ui-color-primary-700);
    }

    .dropzone:focus-within {
      outline: var(--ui-focus-ring-width) solid var(--ui-color-primary-500);
      outline-offset: var(--ui-focus-ring-offset);
    }

    :host([invalid]) .dropzone {
      border-color: var(--ui-color-danger-500);
    }

    :host([disabled]) .dropzone {
      cursor: default;
      opacity: 0.5;
    }

    /* Visually hidden but still focusable/keyboard-operable — the real trigger.
       Clicking anywhere in .dropzone reaches it via native label-wraps-input
       association (same trick as ui-checkbox), so opening the native file
       picker never needs a click handler of our own. */
    .native-input {
      position: absolute;
      width: 0;
      height: 0;
      margin: 0;
      opacity: 0;
    }

    .dropzone-icon {
      font-size: 1.8em;
      line-height: 1;
    }

    .dropzone-title {
      display: block;
      font-weight: 600;
    }

    .dropzone-hint {
      display: block;
      font-size: var(--ui-font-size-sm);
      color: var(--ui-color-neutral-500);
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: var(--ui-spacing-sm);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .file-row {
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      box-sizing: border-box;
      padding: var(--ui-spacing-sm) var(--ui-spacing-md);
      border: var(--ui-border-thin) solid var(--ui-color-neutral-200);
      border-radius: var(--ui-radius-sm);
      background: var(--ui-bg);
    }

    .file-row.error {
      border-color: var(--ui-color-danger-300);
      background: var(--ui-color-danger-50);
    }

    .file-row.done .file-icon {
      color: var(--ui-color-success-500);
    }

    .file-icon {
      flex: none;
      display: flex;
      color: var(--ui-color-neutral-500);
    }

    .file-name {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--ui-spacing-sm);
      font-size: var(--ui-font-size-sm);
      color: var(--ui-color-neutral-500);
    }

    .file-size {
      white-space: nowrap;
    }

    .file-error {
      color: var(--ui-color-danger-600);
    }

    .file-progress {
      position: relative;
      width: 5em;
      height: calc(6px * var(--ui-scale));
      flex: none;
      border-radius: var(--ui-radius-xs);
      background: var(--ui-color-neutral-200);
      overflow: hidden;
    }

    .file-progress-bar {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      background: var(--ui-color-primary-500);
      transition: width 150ms ease;
    }

    .file-row.done .file-progress-bar {
      background: var(--ui-color-success-500);
    }

    .file-progress-label {
      width: 2.5em;
      text-align: right;
    }

    .file-start {
      flex: none;
      border: var(--ui-border-thin) solid var(--ui-color-primary-500);
      background: transparent;
      color: var(--ui-color-primary-600);
      font: inherit;
      font-size: var(--ui-font-size-sm);
      border-radius: var(--ui-radius-xs);
      padding: calc(2px * var(--ui-scale)) var(--ui-spacing-sm);
      cursor: pointer;
    }

    .file-start:hover {
      background: var(--ui-color-primary-50);
    }

    .toolbar {
      display: flex;
      justify-content: flex-end;
    }

    .upload-all {
      border: none;
      background: transparent;
      color: var(--ui-color-primary-600);
      font: inherit;
      font-size: var(--ui-font-size-sm);
      font-weight: 600;
      padding: 0;
      cursor: pointer;
    }

    .upload-all:hover {
      text-decoration: underline;
    }

    .file-remove {
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

    .file-remove:hover {
      opacity: 1;
    }

    .file-remove:disabled {
      cursor: default;
      opacity: 0.3;
    }
  `,
];
