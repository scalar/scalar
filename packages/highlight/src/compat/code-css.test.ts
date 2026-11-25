import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./code.css', import.meta.url), 'utf8')

describe('code-css', () => {
  it.each(['hljs-params', 'hljs-property', 'hljs-punctuation', 'hljs-operator'])(
    'gives .%s its own color',
    (className) => {
      // These tokens used to fall through to the base text color, which is why code looked flat.
      expect(css).toMatch(new RegExp(`\\.${className}\\b[^{]*\\{\\s*color:`))
    },
  )

  it('falls back to plain theme colors where the themes base is not loaded', () => {
    for (const [role, hue] of [
      ['keyword', 'purple'],
      ['string', 'blue'],
      ['number', 'orange'],
      ['parameter', 'red'],
      ['property', 'green'],
    ]) {
      expect(css).toContain(`var(--scalar-code-${role}, var(--scalar-color-${hue}))`)
    }
  })
})
