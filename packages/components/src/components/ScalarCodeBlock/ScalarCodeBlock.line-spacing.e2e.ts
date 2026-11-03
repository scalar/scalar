import { expect, test } from '@test/helpers'
import { measureCodeLineSpacing } from '@test/measure-code-line-spacing'

const content = 'const alpha = 1\n\nalpha\n// comment'

test.describe('ScalarCodeBlock', () => {
  test.use({ component: 'ScalarCodeBlock', story: 'Base' })

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
