import { expect, test } from '@test/helpers'
import { measureCodeLineSpacing } from '@test/measure-code-line-spacing'

test.describe('ScalarMarkdown', () => {
  test.use({ component: 'ScalarMarkdown', story: 'Base' })

  for (const lang of ['plaintext', 'javascript']) {
    for (const { name, style, rule, expected } of [
      { name: 'default', style: '', rule: '', expected: 21 },
      { name: 'custom property', style: '--scalar-code-line-height: 28px', rule: '', expected: 28 },
      { name: 'container override', style: '', rule: 'line-height: 16px;', expected: 16 },
    ]) {
      test(`${lang}: uniform ${name} fenced-code spacing`, async ({ mount, page }) => {
        const story = await mount('ScalarMarkdown/Base', {
          value: `\`\`\`${lang}\nconst alpha = 1\n\nalpha\n// comment\n\`\`\``,
          style,
        })
        await page.addStyleTag({
          content: `.scalar-app .markdown pre { ${rule} } .scalar-app .markdown pre code { font-size: 14px; }`,
        })
        await page.evaluate(() => document.fonts.ready)

        const pitches = await measureCodeLineSpacing(story.locator('pre code'))
        expect(pitches.length).toBe(2)
        for (const pitch of pitches) {
          expect(pitch).toBeCloseTo(expected, 1)
        }
      })
    }
  }
})
