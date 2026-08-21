/**
 * Reading the active light/dark scheme back out in JavaScript.
 *
 * Nothing in this library's *own* styling needs this — themes/theme.ts is
 * built so every component follows `color-scheme` purely in CSS, via
 * `light-dark()`, with no script involved. This exists only for embedded
 * third-party widgets that do their theming in JavaScript and take a
 * light/dark prop of their own, which therefore have to be told which scheme
 * is active and re-told when it changes. Nothing in the library calls it
 * today.
 *
 * Reach for this only for that case. Anything styled by this library's own
 * CSS should stay declarative.
 */

export type ResolvedColorScheme = "light" | "dark";

/**
 * The scheme `element` actually renders under right now.
 *
 * `color-scheme` computes to the keywords as specified, not to a decision —
 * `light dark` means "either, ask the OS" — so resolving it takes both the
 * computed value and the OS preference. An unset (`normal`) value resolves to
 * light, matching how `light-dark()` itself treats it.
 */
export function resolveColorScheme(element: Element): ResolvedColorScheme {
  const declared = getComputedStyle(element).colorScheme;
  const allowsLight = declared.includes("light");
  const allowsDark = declared.includes("dark");

  // Exactly one keyword: the scheme is forced, the OS preference is irrelevant.
  if (allowsDark && !allowsLight) return "dark";
  if (allowsLight && !allowsDark) return "light";

  // Either `light dark` (follow the OS) or `normal` (light, as above — the
  // matchMedia arm can't be reached in that case since allowsDark is false).
  return allowsDark && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Calls `onChange` whenever the scheme `element` renders under flips, and
 * returns a function that stops watching.
 *
 * Two independent triggers, because either can flip the resolved value on its
 * own: the OS preference changing while `color-scheme` is `light dark`, and
 * the document root's own `color-scheme` being reassigned (themes/theme.ts
 * declares it only on `:root`, so that is the one place a consumer overrides
 * it — see its comment there).
 *
 * The root is watched through its `style` and `class` attributes, which covers
 * setting `documentElement.style.colorScheme` or toggling a class that a
 * stylesheet keys off. A consumer who instead swaps the rule inside a
 * stylesheet, with no DOM mutation at all, won't be noticed — there is no
 * event for that, and it isn't worth polling for.
 */
export function observeColorScheme(
  element: Element,
  onChange: (scheme: ResolvedColorScheme) => void,
): () => void {
  let current = resolveColorScheme(element);

  const check = () => {
    const next = resolveColorScheme(element);
    if (next === current) return;
    current = next;
    onChange(next);
  };

  const preference = matchMedia("(prefers-color-scheme: dark)");
  preference.addEventListener("change", check);

  const rootObserver = new MutationObserver(check);
  rootObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  return () => {
    preference.removeEventListener("change", check);
    rootObserver.disconnect();
  };
}
