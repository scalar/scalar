import { expect, test } from '@test/helpers'

test.describe('ScalarModal', () => {
  test.use({ story: 'With Toasts' })

  test('shows a toast inside the open modal, skipping a toaster the user cannot see', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Modal with toasts' })
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: 'Show toast' }).click()

    const toast = dialog.getByText('Saved from inside the modal')
    await expect(toast).toBeVisible()

    // The toast lives inside the modal, so a click on it is not a click on the backdrop
    await toast.click()
    await expect(dialog).toBeVisible()
  })
})
