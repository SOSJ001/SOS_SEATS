/**
 * Whether a nav item matches the current path. `exact` items only match
 * themselves; others also match their sub-pages. Trailing slashes are ignored.
 * @param {string} path
 * @param {{ href: string, exact?: boolean }} item
 */
export function isNavActive(path, item) {
  const trim = (/** @type {string} */ s) => (s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s);
  const current = trim(path || "");
  const href = trim(item.href);
  if (item.exact) return current === href;
  return current === href || current.startsWith(href + "/");
}
