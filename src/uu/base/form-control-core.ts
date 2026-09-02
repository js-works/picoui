// The framework-agnostic engine every form-associated control delegates to —
// form value, validity, and the form-lifecycle callback bodies. Composition,
// not inheritance: `FormControlElement` constructs one and drives it from its
// own reactive lifecycle. NO Lit import.
//
// Same shape as src/main's OptionListController / autocomplete-core: the host
// is passed in and the engine reads/writes its plain properties so the host's
// own change detection still fires. Everything the base and a subclass both
// need travels through the `FormControlConfig` object passed to `super()` (a
// plain object built in each layer's own file) — no `protected` members, no
// public wiring on the element.

import type { TemplateResult } from "lit";

export type {
  FormControlHost,
  FormControlConfig,
  FormControlRenderApi,
  FieldValidity,
  FormValue,
  FormRestoreState,
};
export { FormControlController, EMPTY_VALIDITY };

type FormValue = string | File | FormData | null;
type FormRestoreState = string | File | FormData | null;

interface FieldValidity {
  flags: ValidityStateFlags;
  message: string;
}

const EMPTY_VALIDITY: FieldValidity = { flags: {}, message: "" };

// The slice of the host the engine and the config callbacks touch. Structural,
// so this file takes no dependency on the element classes.
interface FormControlHost extends HTMLElement {
  renderRoot: HTMLElement | DocumentFragment;
  name: string;
  disabled: boolean;
  required: boolean;
  errorText: string;
}

// Passed to `config.render` — the shadow-scoped ids the message row already
// owns, plus the base's own delegated input/change handlers, so a layout can
// wire them onto whatever native control it renders.
interface FormControlRenderApi {
  controlId: string;
  describedBy: string | undefined;
  // The info/error row, already rendered (an empty template when neither is
  // set). A layout drops it wherever it wants below the control.
  messages: TemplateResult;
  onControlInput: (event: Event) => void;
  onControlChange: (event: Event) => void;
}

// Method syntax (not arrow properties) on purpose: bivariant parameters let a
// subclass hand up a config whose callbacks are typed to its own host.
interface FormControlConfig {
  // What the control submits (before the disabled → null override).
  formValue(host: FormControlHost): FormValue;
  // Validity flags + message for the current state. Omitted → always valid
  // (validity then comes only from `setCustomValidity` / `errorText`).
  computeValidity?(host: FormControlHost): FieldValidity;
  // The element `setValidity` anchors to (also where the native error bubble
  // points). Null before the control has rendered — sync is skipped until then.
  anchor(host: FormControlHost): HTMLElement | null;
  // `formResetCallback` / `formStateRestoreCallback` behavior.
  reset(host: FormControlHost): void;
  restore(host: FormControlHost, state: FormRestoreState): void;
  // The whole shadow tree. The base owns nothing visual — it hands the layout
  // the render api and this callback draws it.
  render(host: FormControlHost, api: FormControlRenderApi): TemplateResult;
  // The rendered native control fired input/change — pull its state onto the
  // host's own properties before the base syncs + re-dispatches.
  onControlInput?(host: FormControlHost): void;
  onControlChange?(host: FormControlHost): void;
}

class FormControlController {
  readonly #host: FormControlHost;
  readonly #internals: ElementInternals;
  readonly #config: FormControlConfig;

  constructor(
    host: FormControlHost,
    internals: ElementInternals,
    config: FormControlConfig,
  ) {
    this.#host = host;
    this.#internals = internals;
    this.#config = config;
  }

  // Called once from the host's firstUpdated().
  mounted(): void {
    this.syncFormValue();
    this.syncValidity();
  }

  // Called from the host's updated(). Cheap enough to re-sync unconditionally
  // rather than teach the engine every subclass's state props.
  hostUpdated(): void {
    this.syncFormValue();
    this.syncValidity();
  }

  syncFormValue(): void {
    this.#internals.setFormValue(
      this.#host.disabled ? null : this.#config.formValue(this.#host),
    );
  }

  syncValidity(): void {
    const anchor = this.#config.anchor(this.#host);
    if (!anchor) return;

    // A disabled control is barred from constraint validation (HTML spec).
    // `readonly` is barred too, but only the field layer knows about it — its
    // `computeValidity` returns empty in that case.
    const { flags, message } = this.#host.disabled
      ? EMPTY_VALIDITY
      : (this.#config.computeValidity?.(this.#host) ?? EMPTY_VALIDITY);

    this.#internals.setValidity(flags, message, anchor);
    this.#reflectInvalid();
  }

  setCustomValidity(message: string): void {
    if (message) {
      this.#internals.setValidity(
        { customError: true },
        message,
        this.#config.anchor(this.#host) ?? undefined,
      );
      this.#reflectInvalid();
    } else {
      this.syncValidity();
    }
  }

  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  formReset(): void {
    this.#config.reset(this.#host);
    this.syncFormValue();
    this.syncValidity();
  }

  formRestore(state: FormRestoreState): void {
    this.#config.restore(this.#host, state);
    this.syncFormValue();
  }

  #reflectInvalid(): void {
    this.#host.toggleAttribute(
      "invalid",
      !this.#internals.validity.valid || !!this.#host.errorText,
    );
  }
}
