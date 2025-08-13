import { test } from '@test/helpers'

test.describe('ScalarErrorBoundary', () =>
  ['Base'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the dropdown
      await page.getByRole('button', { name: 'Throw Error' }).click()
      await snapshot()
    }),
  ))
