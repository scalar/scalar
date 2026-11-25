/**
 * The code font for Monaco editors: the same system monospace stack as `--scalar-font-code`.
 *
 * It is a literal rather than `var(--scalar-font-code)` because Monaco caches glyph widths under the font family
 * string. A variable keeps the same string when a theme changes the font behind it, so the cached widths would go
 * stale and the cursor would drift away from the text.
 */
export const MONACO_FONT_FAMILY =
  'ui-monospace, "SFMono-Regular", "SF Mono", menlo, consolas, "Liberation Mono", monospace'
