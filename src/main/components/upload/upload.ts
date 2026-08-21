import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { uploadStyles } from "./upload.styles.js";
import { uploadIcon } from "./icons/upload.icon.js";
import { fileIcon } from "./icons/file.icon.js";
import { focusOnLabelClick } from "../../shared/label-focus/label-focus.js";

export interface UploadEntry {
  readonly file: File;
  readonly status: "idle" | "uploading" | "done" | "error";
  readonly progress: number | null;
  readonly error: string | null;
}

export interface UploadFileRejectDetail {
  file: File;
  reason: string;
}

export interface UploadRequestDetail {
  file: File;
}

/**
 * A themed replacement for `<input type="file">` — drag-and-drop or
 * click-to-browse onto a dropzone, form-associated like the rest of this
 * library. The dropzone is a real `<label>` wrapping a visually hidden (but
 * still focusable/keyboard-operable) `<input type="file">`; native
 * label-wraps-input association opens the file picker on click, the same
 * trick `ui-checkbox` uses, so no click handler of our own is needed.
 *
 * Unlike Vaadin's `<vaadin-upload>`, this component does **not** perform the
 * actual network transfer — no XHR, no `target` URL, no built-in abort. None
 * of this library's other form fields touch the network either; they expose
 * a value via `ElementInternals`/`FormData` and leave it to the app to act on
 * it. Selected files ride along in the enclosing form's submitted `FormData`
 * under `name` (one entry per file, same as a native
 * `<input type="file" multiple>`), which is enough for the common case of
 * "upload happens as part of a normal form submit".
 *
 * What *is* modeled after Vaadin is the **queueing** behavior: by default
 * (`manual` unset) every accepted file immediately fires an `upload-request`
 * event (`detail: { file }`) — the hook a caller's own fetch/XHR listens for
 * to start sending that file right away. Set `manual` to hold added files in
 * the list without firing that event; the app then calls `uploadFile(file)`
 * (wired to each row's own Start/Retry button) or `uploadAll()` (the
 * "Upload all" toolbar button, shown whenever anything is waiting) to fire
 * `upload-request` on demand — one at a time or all together. A failed file
 * (`status: "error"`) always gets a Retry button, in both modes, since a
 * caller's upload can fail regardless of how it was started.
 *
 * Either way, the actual transfer stays entirely the caller's job:
 * `setFileProgress`/`setFileDone`/`setFileError` are a small imperative API
 * keyed by the same `File` object, for it to report progress back onto this
 * component's UI — this component never calls them itself.
 *
 * Files that don't pass `accept`/`max-files`/`max-file-size` are never added
 * to the list — they instead fire a `file-reject` event
 * (`detail: { file, reason }`), mirroring how a native file input silently
 * ignores non-matching `accept` picks rather than surfacing a form error.
 */
@customElement("ui-upload")
export class Upload extends LitElement {
  static formAssociated = true;

  #internals: ElementInternals;
  #input!: HTMLInputElement;

  @property()
  accessor name = "";

  @property()
  accessor accept = "";

  @property({ type: Boolean })
  accessor multiple = false;

  @property({ type: Number, attribute: "max-files" })
  accessor maxFiles: number | undefined = undefined;

  @property({ type: Number, attribute: "max-file-size" })
  accessor maxFileSize: number | undefined = undefined;

  @property({ reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  @property({ type: Boolean })
  accessor required = false;

  // When set, accepted files wait in the list with status "idle" instead of
  // immediately firing `upload-request` — the caller starts each one (or all
  // of them) on demand via `uploadFile`/`uploadAll`. See the class doc above.
  @property({ type: Boolean })
  accessor manual = false;

  @state()
  accessor entries: UploadEntry[] = [];

  @state()
  accessor dragOver = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    // <label for> support — see the helper for what the platform does
    // and doesn't do for a form-associated custom element.
    focusOnLabelClick(this);
  }

  static styles = uploadStyles;

  get files(): File[] {
    return this.entries.map((entry) => entry.file);
  }

  protected firstUpdated() {
    this.#input = this.renderRoot.querySelector("input")!;
    this.#syncFormValue();
    this.#syncValidity();
  }

  #syncFormValue() {
    if (this.disabled) {
      this.#internals.setFormValue(null);
      return;
    }

    const formData = new FormData();
    for (const entry of this.entries) {
      formData.append(this.name, entry.file);
    }
    this.#internals.setFormValue(formData);
  }

  #syncValidity() {
    if (!this.#input) return;

    const flags: ValidityStateFlags = {};
    let message = "";

    if (this.required && this.entries.length === 0) {
      flags.valueMissing = true;
      message = "Please select a file.";
    }

    this.#internals.setValidity(flags, message, this.#input);
    this.toggleAttribute("invalid", !this.#internals.validity.valid);
  }

  #rejectionReason(file: File, countSoFar: number): string | null {
    if (
      this.multiple &&
      this.maxFiles !== undefined &&
      countSoFar >= this.maxFiles
    ) {
      return `Too many files (max ${this.maxFiles}).`;
    }

    if (this.accept && !fileMatchesAccept(file, this.accept)) {
      return "File type not allowed.";
    }

    if (this.maxFileSize !== undefined && file.size > this.maxFileSize) {
      return `File is too large (max ${formatFileSize(this.maxFileSize)}).`;
    }

    return null;
  }

  #addFiles(incoming: File[]) {
    if (this.disabled || incoming.length === 0) return;

    // A non-multiple field replaces whatever was selected before, same as a
    // native single-file `<input type="file">` — only the last pick survives.
    const candidates = this.multiple ? incoming : incoming.slice(-1);
    const baseCount = this.multiple ? this.entries.length : 0;
    const accepted: UploadEntry[] = [];

    for (const file of candidates) {
      const reason = this.#rejectionReason(file, baseCount + accepted.length);
      if (reason) {
        this.dispatchEvent(
          new CustomEvent<UploadFileRejectDetail>("file-reject", {
            detail: { file, reason },
            bubbles: true,
            composed: true,
          }),
        );
        continue;
      }
      accepted.push({ file, status: "idle", progress: null, error: null });
    }

    if (accepted.length === 0) return;

    this.entries = this.multiple ? [...this.entries, ...accepted] : accepted;
    this.#syncFormValue();
    this.#syncValidity();
    this.#notifyChanged();

    if (!this.manual) {
      for (const entry of accepted) this.uploadFile(entry.file);
    }
  }

  #notifyChanged() {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  #onNativeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.#addFiles(Array.from(input.files ?? []));
    // Reset so picking the exact same file again still fires a change.
    input.value = "";
  }

  #onDragOver(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    this.dragOver = true;
  }

  #onDragLeave() {
    this.dragOver = false;
  }

  #onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    if (this.disabled) return;
    this.#addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  removeFile(file: File) {
    const next = this.entries.filter((entry) => entry.file !== file);
    if (next.length === this.entries.length) return;

    this.entries = next;
    this.#syncFormValue();
    this.#syncValidity();
    this.#notifyChanged();
  }

  clear() {
    if (this.entries.length === 0) return;

    this.entries = [];
    this.#syncFormValue();
    this.#syncValidity();
    this.#notifyChanged();
  }

  // Driven by a caller running its own upload (fetch/XHR) — this component
  // never calls these itself.
  setFileProgress(file: File, progress: number) {
    this.entries = this.entries.map((entry) =>
      entry.file === file
        ? {
            ...entry,
            status: "uploading",
            progress: Math.max(0, Math.min(100, progress)),
            error: null,
          }
        : entry,
    );
  }

  setFileDone(file: File) {
    this.entries = this.entries.map((entry) =>
      entry.file === file
        ? { ...entry, status: "done", progress: 100, error: null }
        : entry,
    );
  }

  setFileError(file: File, message: string) {
    this.entries = this.entries.map((entry) =>
      entry.file === file
        ? { ...entry, status: "error", error: message }
        : entry,
    );
  }

  // Fires `upload-request` for one file — called automatically per accepted
  // file unless `manual` is set, and always available for a row's own
  // Start/Retry button or a caller's own code to invoke directly.
  uploadFile(file: File) {
    if (!this.entries.some((entry) => entry.file === file)) return;

    this.dispatchEvent(
      new CustomEvent<UploadRequestDetail>("upload-request", {
        detail: { file },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Fires `upload-request` for every file not already done or in flight —
  // backs the "Upload all" toolbar button shown in `manual` mode, but works
  // regardless of `manual` (e.g. to bulk-retry every failed file).
  uploadAll() {
    for (const entry of this.entries) {
      if (entry.status === "idle" || entry.status === "error") {
        this.uploadFile(entry.file);
      }
    }
  }

  formResetCallback() {
    // Matches a native `<input type="file">`: there is no "default" selection
    // to restore to, a reset always clears it.
    this.entries = [];
    this.#syncFormValue();
    this.#syncValidity();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
    this.#syncFormValue();
  }

  // Browsers never restore actual file content across navigation/autofill for
  // a native file input either, for the same reason: a `File`'s bytes aren't
  // something a `formStateRestoreCallback` payload can carry back. Left as a
  // deliberate no-op rather than omitted, to document that this was
  // considered rather than overlooked.
  formStateRestoreCallback() {}

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  setCustomValidity(message: string) {
    if (message) {
      this.#internals.setValidity({ customError: true }, message, this.#input);
    } else {
      this.#syncValidity();
    }
  }

  focus(options?: FocusOptions) {
    this.#input?.focus(options);
  }

  #renderEntry(entry: UploadEntry) {
    return html`
      <li class="file-row ${entry.status}">
        <span class="file-icon">${fileIcon}</span>
        <span class="file-name" title=${entry.file.name}>
          ${entry.file.name}
        </span>
        <span class="file-meta">
          ${entry.status === "uploading" && entry.progress !== null
            ? html`
                <span class="file-progress">
                  <span
                    class="file-progress-bar"
                    style="width: ${entry.progress}%"
                  ></span>
                </span>
                <span class="file-progress-label">
                  ${Math.round(entry.progress)}%
                </span>
              `
            : entry.status === "error"
              ? html`<span class="file-error">${entry.error}</span>`
              : html`<span class="file-size">
                  ${entry.status === "done" ? "✓ " : ""}${formatFileSize(
                    entry.file.size,
                  )}
                </span>`}
        </span>
        ${!this.disabled &&
        ((entry.status === "idle" && this.manual) || entry.status === "error")
          ? html`
              <button
                type="button"
                class="file-start"
                @click=${() => this.uploadFile(entry.file)}
              >
                ${entry.status === "error" ? "Retry" : "Start"}
              </button>
            `
          : nothing}
        <button
          type="button"
          class="file-remove"
          aria-label="Remove ${entry.file.name}"
          ?disabled=${this.disabled}
          @click=${() => this.removeFile(entry.file)}
        >
          ×
        </button>
      </li>
    `;
  }

  render() {
    const pending = this.entries.some(
      (entry) => entry.status === "idle" || entry.status === "error",
    );

    return html`
      <div class="upload">
        <label
          class="dropzone ${this.dragOver ? "dragover" : ""}"
          @dragover=${this.#onDragOver}
          @dragleave=${this.#onDragLeave}
          @drop=${this.#onDrop}
        >
          <input
            type="file"
            class="native-input"
            name=${this.name}
            accept=${this.accept || nothing}
            ?multiple=${this.multiple}
            ?disabled=${this.disabled}
            ?required=${this.required}
            @change=${this.#onNativeChange}
          />
          <span class="dropzone-icon">${uploadIcon}</span>
          <span class="dropzone-title">Drop files here</span>
          <span class="dropzone-hint">or click to browse</span>
        </label>

        ${this.entries.length > 0
          ? html`
              <ul class="file-list">
                ${this.entries.map((entry) => this.#renderEntry(entry))}
              </ul>
            `
          : nothing}
        ${this.manual && !this.disabled && pending
          ? html`
              <div class="toolbar">
                <button
                  type="button"
                  class="upload-all"
                  @click=${() => this.uploadAll()}
                >
                  Upload all
                </button>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

// Matches a comma-separated `accept` list against a `File`, the same shape as
// the native attribute: extensions (".png"), MIME wildcards ("image/*"), or
// exact MIME types ("application/pdf").
function fileMatchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim())
    .filter(Boolean);

  if (patterns.length === 0) return true;

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    if (pattern.endsWith("/*")) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    return file.type === pattern;
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-upload": Upload;
  }
}
