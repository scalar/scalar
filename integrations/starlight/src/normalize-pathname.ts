/**
 * Ensure the path starts with a single leading slash and has no trailing slash,
 * so it works both as an Astro route pattern and as a Starlight sidebar link.
 *
 * Splitting on `/` rather than trimming with a regex keeps this linear and
 * sidesteps the backtracking a `/+` pattern can cause on adversarial input. It
 * also collapses empty segments (e.g. from `//`), which Astro route patterns
 * would reject anyway.
 *
 * This lives in its own module because both the plugin (when registering a
 * reference) and the route component (when matching the request path back to a
 * reference) must normalize identically — if the two ever drifted, lookups
 * would silently miss and render the wrong reference.
 */
export const normalizePathname = (pathname: string): string => `/${pathname.split('/').filter(Boolean).join('/')}`
