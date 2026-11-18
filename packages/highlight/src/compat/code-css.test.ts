import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./code.css', import.meta.url), 'utf8')

describe('code-css', () => {
  it.each(['hljs-params', 'hljs-property', 'hljs-punctuation'])('gives .%s its own color', (className) => {
    // These tokens used to fall through to the base text color, which is why code looked flat.
    expect(css).toMatch(new RegExp(`\\.${className}\\b[^{]*\\{\\s*color:`))
  })

  it('falls back to plain theme colors without relative color support', () => {
    const fallback = css.slice(0, css.indexOf('@supports'))

    for (const hue of ['green', 'red', 'blue', 'orange', 'purple']) {
      expect(fallback).toContain(`--scalar-code-${hue}: var(--scalar-color-${hue});`)
    }
  })
})
