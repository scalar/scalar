import { readFileSync } from 'node:fs'

import { expect, test } from '@test/helpers'
import { measureCodeLineSpacing } from '@test/measure-code-line-spacing'

const highlightingStyles = readFileSync(new URL('../../../../highlight/src/compat/code.css', import.meta.url), 'utf8')

const content = 'const alpha = 1\n\nalpha\n// comment'

test.describe('ScalarCodeBlock', () => {
  test.use({ component: 'ScalarCodeBlock', story: 'Base' })

  for (const scalarApp of [false, true]) {
    for (const { name, rule, expected } of [
      { name: 'default', rule: '', expected: 19.6 },
      { name: 'custom property', rule: 'body { --scalar-code-line-height: 2; }', expected: 28 },
      { name: 'container override', rule: 'pre { line-height: 24px; }', expected: 24 },
    ]) {
      test(`direct stylesheet, Scalar wrapper ${scalarApp}: uniform ${name} spacing`, async ({ page }) => {
        await page.setContent(
          `<div class="${scalarApp ? 'scalar-app' : ''}"><pre><code class="hljs"><span class="hljs-keyword">const</span> alpha = 1\n\nalpha\n// comment</code></pre></div>`,
        )
        // Load consumer rules first to verify that specificity beats the stylesheet default.
        await page.addStyleTag({
          content: `body { font-size: 14px; --scalar-font-code: monospace; } pre { font-family: monospace; } ${rule}`,
        })
        await page.addStyleTag({ content: highlightingStyles })

        const pitches = await measureCodeLineSpacing(page.locator('code'))
        expect(pitches.length).toBe(2)
        for (const pitch of pitches) {
          expect(pitch).toBeCloseTo(expected, 1)
        }
      })
    }
  }

  for (const lang of ['plaintext', 'javascript']) {
    for (const lineNumbers of [false, true]) {
      for (const { name, style, rule, expected } of [
        { name: 'default', style: '', rule: '', expected: 19.6 },
        { name: 'custom property', style: '--scalar-code-line-height: 24px', rule: '', expected: 24 },
        { name: 'container override', style: '', rule: 'line-height: 16px;', expected: 16 },
      ]) {
        test(`${lang}, line numbers ${lineNumbers}: uniform ${name} spacing`, async ({ mount, page }) => {
          const story = await mount('ScalarCodeBlock/Base', { content, lang, lineNumbers, copy: false, style })
          await page.addStyleTag({ content: `.scalar-code-block pre { font-size: 14px; ${rule} }` })
          await page.evaluate(() => document.fonts.ready)

          const pitches = await measureCodeLineSpacing(story.locator('code'))
          expect(pitches.length).toBe(2)
          for (const pitch of pitches) {
            // Layout rounds fractional CSS pixels to the browser's subpixel grid.
            expect(pitch).toBeCloseTo(expected, 1)
          }
        })
      }
    }
  }
})
