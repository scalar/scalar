import { test } from '@test/helpers'

import { samples } from './samples'

test.describe('ScalarMarkdownSummary', () => {
  test.use({
    /* Uses the stories in ScalarMarkdown.stories.ts */
    component: 'ScalarMarkdown',
    story: 'Summary',
    background: true,
  })

  test('Resizing', async ({ page, snapshot }) => {
    // Make the viewport wider
    await page.setViewportSize({ width: 800, height: 200 })
    await snapshot('1-closed-wide')
    // Make the viewport narrower to trigger truncation
    await page.setViewportSize({ width: 400, height: 200 })
    await snapshot('2-closed-narrow')
    // Open the summary
    await page.getByRole('button', { name: 'More' }).click()
    await snapshot('3-open')
    // Close the summary
    await page.getByRole('button', { name: 'Less' }).click()
    // Should be the same as the second snapshot
    await snapshot('2-closed-narrow')
  })

  samples.forEach(({ label }) => {
    test.describe(() => {
      test.use({ args: { value: label } })
      test(label, ({ snapshot }) => snapshot(label.toLocaleLowerCase()))
    })
  })
})
