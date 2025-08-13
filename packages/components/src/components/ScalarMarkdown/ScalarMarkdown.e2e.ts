import { test, takeSnapshot } from '@test/helpers'

test.describe('ScalarMarkdown', () => {
  test.use({ background: true })

  const samples = ['Alerts', 'Blockquotes', 'Codeblocks', 'Headers', 'Html', 'Inline', 'Lists', 'Paragraphs', 'Tables']

  samples.forEach((sample) => test(sample, takeSnapshot))

  const summarySamples = ['Summary', 'Summary with Rich Text']

  summarySamples.forEach((sample) =>
    test(sample, async ({ page, snapshot }) => {
      // Make the viewport wider
      await page.setViewportSize({ width: 800, height: 200 })
      await snapshot('1-closed-wide')
      // Make the viewport narrower to trigger truncation
      await page.setViewportSize({ width: 400, height: 200 })
      await snapshot('2-closed-narrow')
      // Open the summary
      await page.getByRole('button', { name: 'Read More' }).click()
      await snapshot('3-open')
      // Close the summary
      await page.getByRole('button', { name: 'Close' }).click()
      // Should be the same as the second snapshot
      await snapshot('2-closed-narrow')
    }),
  )

  test.describe('Line Clamping', () => {
    const values = [0, 1, 2, 6] as const
    values.forEach((value) =>
      test.describe(() => {
        test.use({ component: 'ScalarMarkdown', story: 'Base', args: { clamp: value } })
        test(`Clamp ${value} Line${value === 1 ? '' : 's'}`, async ({ snapshot }) => await snapshot(`clamp-${value}`))
      }),
    )
  })
})
