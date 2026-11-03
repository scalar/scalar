import { expect, test } from '@test/helpers'

test.describe('ScalarMarkdown', () => {
  test.use({
    component: 'ScalarMarkdown',
    story: 'Base',
    args: { value: '```javascript\n1\n2\n3\n```' },
  })

  test('preserves highlighted token spacing inside Markdown code blocks', async ({ mountedStory }) => {
    const spacing = await mountedStory.locator('pre code').evaluate((code) => {
      const codeStyle = getComputedStyle(code)
      const tokenStyle = getComputedStyle(code.querySelector('span')!)
      return {
        code: Number.parseFloat(codeStyle.lineHeight) / Number.parseFloat(codeStyle.fontSize),
        token: Number.parseFloat(tokenStyle.lineHeight) / Number.parseFloat(tokenStyle.fontSize),
      }
    })

    // These ratios preserve pre-migration spacing rather than define a uniform spacing policy.
    // TODO: Revisit both ratios when https://github.com/scalar/scalar/issues/10848 is addressed.
    expect(spacing.code).toBeCloseTo(1.5, 5)
    expect(spacing.token).toBeCloseTo(1.4, 5)
  })
})
