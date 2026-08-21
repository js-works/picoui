// Resolving the active language/direction for a component, and noticing when
// it changes.
//
// `lang` and `dir` are native global HTML attributes, not reactive properties,
// so Lit doesn't observe them — but any component that formats dates, numbers
// or names through `Intl` depends on both. These helpers are what ui-date-picker
// and ui-date-field share instead of each rolling their own.
//
// This deliberately does not go through a translation/message system: the only
// thing callers need is the BCP 47 tag to hand to `Intl`.

export { closestLang, closestDir, observeLocale };

/**
 * The language tag in effect for `element` — its own `lang`, else the nearest
 * ancestor's, else the document's, else the browser's.
 *
 * Mirrors how the `lang` attribute itself inherits, so a component nested under
 * a `<div lang="de-DE">` reports German without the caller wiring anything up.
 */
function closestLang(element: Element): string {
  return (
    element.closest("[lang]")?.getAttribute("lang") ||
    document.documentElement.lang ||
    navigator.language
  );
}

/** The text direction in effect for `element`, resolved the same way. */
function closestDir(element: Element): string {
  return (
    element.closest("[dir]")?.getAttribute("dir") ||
    document.documentElement.dir ||
    "ltr"
  );
}

/**
 * Calls `onChange` when the `lang`/`dir` that `closestLang`/`closestDir` would
 * report for `element` may have changed, and returns a function that stops
 * watching.
 *
 * Two places are watched, because either can change the answer: the element
 * itself (a caller setting `lang` on it directly) and the document root (where
 * a page-wide language switch lands, since `lang` inherits from there).
 *
 * An *intermediate* ancestor changing its `lang` is not caught — that would
 * mean observing the whole tree for a case that doesn't come up in practice.
 * Callers that need it can re-render by hand.
 */
function observeLocale(element: Element, onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  const options = { attributes: true, attributeFilter: ["lang", "dir"] };

  observer.observe(element, options);
  observer.observe(document.documentElement, options);

  return () => observer.disconnect();
}
