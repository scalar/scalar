import { expect, test } from '@test/helpers'

test.describe('ScalarCodeBlock', () => {
  test.use({ component: 'ScalarCodeBlock', story: 'Base' })

  for (const { name, content } of [
    { name: 'plain text', content: 'first\nsecond\nthird' },
    { name: 'blank lines', content: 'first\n\nthird' },
  ]) {
    test(`preserves inherited spacing for ${name}`, async ({ mount, page }) => {
      const story = await mount('ScalarCodeBlock/Base', { content, lang: 'plaintext', copy: false })
      // A consumer's inherited spacing must still apply to lines without highlighted tokens.
      await page.addStyleTag({ content: '.scalar-code-block pre { font-size: 14px; line-height: 16px; }' })
      await page.evaluate(() => document.fonts.ready)

      const lineDistance = await story.locator('code').evaluate((code) => {
        const text = code.firstChild!
        const first = document.createRange()
        first.setStart(text, 0)
        first.setEnd(text, 1)
        const last = document.createRange()
        last.setStart(text, text.textContent!.length - 1)
        last.setEnd(text, text.textContent!.length)
        return last.getBoundingClientRect().top - first.getBoundingClientRect().top
      })

      expect(lineDistance).toBe(32)
    })
  }
})
