/**
 * Every asset the site loads at runtime — images, models, PDFs — lives outside
 * the bundle, so Vite never rewrites those URLs for us. On GitHub Pages the
 * site is served from a sub-path (/Portfolio/) until a custom domain moves it
 * back to the root, and a hardcoded "/images/foo.png" 404s under a sub-path.
 *
 * Everything runtime-loaded therefore goes through `asset()`, which puts
 * Vite's BASE_URL in front. Locally and on a custom domain the base is "/",
 * so the result is exactly the path that was passed in.
 */

/** Always starts and ends with a slash, e.g. "/" or "/Portfolio/". */
export const BASE = import.meta.env.BASE_URL

/** True for anything already resolvable as-is: http(s), protocol-relative, data:, blob:. */
const EXTERNAL = /^(https?:)?\/\/|^(data|blob):/i

export function asset(path?: string | null): string {
  if (!path) return ''
  if (EXTERNAL.test(path)) return path
  // Idempotent: applying it twice must not produce /Portfolio/Portfolio/… .
  const rooted = '/' + path.replace(/^\.?\/+/, '')
  if (BASE !== '/' && rooted.startsWith(BASE)) return rooted
  return BASE + rooted.slice(1)
}
