// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The stylesheet is read from disk on purpose: `?raw` imports of a source
 * stylesheet come back empty under the Tailwind Vite plugin.
 */
const stylesheet = readFileSync(resolve(import.meta.dirname, 'tailwind.config.css'), 'utf8')

/**
 * Returns the body of the innermost rule block that contains `declaration`,
 * or an empty string when no block declares it.
 */
const blockDeclaring = (css: string, declaration: string): string =>
  [...css.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1] ?? '').find((body) => body.includes(declaration)) ?? ''

describe('tailwind.config', () => {
  it('keeps the schema toggle hit box at 24px in every container', () => {
    // The toggle is a transparent button, so shrinking it in the narrow
    // container bought nothing visually but dropped the target below the
    // 24px WCAG 2.5.8 minimum. Only the glyph tokens may shrink there.
    const wide = blockDeclaring(stylesheet, '--schema-glyph-size: 18px')
    expect(wide).toContain('--schema-toggle-size: 24px')
    expect(wide).toContain('--schema-toggle-half: 12px')

    const narrow = blockDeclaring(stylesheet, '--schema-glyph-size: 16px')
    expect(narrow).not.toBe('')
    expect(narrow).not.toContain('--schema-toggle-size')
    expect(narrow).not.toContain('--schema-toggle-half')
  })
})
