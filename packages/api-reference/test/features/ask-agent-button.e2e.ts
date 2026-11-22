import { type Locator, type Page, expect, test } from '@playwright/test'
import type { HtmlRenderingConfiguration } from '@scalar/types/api-reference'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const galaxy = sources[0]

/** POST /user/signup, whose request example footer holds the example picker, the agent field and Test Request */
const getOperation = async (page: Page, configuration?: Partial<HtmlRenderingConfiguration>): Promise<Locator> => {
  const example = await serveExample({ ...galaxy, ...configuration })
  await page.goto(`${example}#tag/authentication/POST/user/signup`)

  return page.getByRole('region', { name: 'Create a user', exact: true })
}

/**
 * Whether a pointer at the centre of the element would reach the element itself. The expanded agent
 * field is drawn over the whole footer, so a control underneath it shows no focus ring and takes no clicks.
 */
const isUncovered = (locator: Locator): Promise<boolean> =>
  locator.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect()
    const hit = document.elementFromPoint(x + width / 2, y + height / 2)

    return hit !== null && element.contains(hit)
  })

test.describe('ask agent button', () => {
  test('uncovers the example picker when focus moves back to it from a typed question', async ({ page }) => {
    const operation = await getOperation(page)
    const picker = operation.getByRole('button', { name: 'Marc' })

    await picker.focus()
    await page.keyboard.press('Tab')
    await expect(operation.getByRole('textbox', { name: 'Ask AI Agent' })).toBeFocused()
    await page.keyboard.type('hello')
    await page.keyboard.press('Shift+Tab')

    await expect(picker).toBeFocused()
    expect(await isUncovered(picker)).toBe(true)
  })

  test('uncovers Test Request when focus moves on past the send button', async ({ page }) => {
    const operation = await getOperation(page)
    const testRequest = operation.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })

    await operation.getByRole('textbox', { name: 'Ask AI Agent' }).focus()
    await page.keyboard.type('hello')
    // The send button, then on to Test Request
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(testRequest).toBeFocused()
    expect(await isUncovered(testRequest)).toBe(true)
  })

  test('uncovers Test Request in the card without a code sample', async ({ page }) => {
    // Without any client the card falls back to method, path and the same actions
    const operation = await getOperation(page, { hiddenClients: true })
    const testRequest = operation.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })

    await operation.getByRole('textbox', { name: 'Ask AI Agent' }).focus()
    await page.keyboard.type('hello')
    // The send button, then on to Test Request
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(testRequest).toBeFocused()
    expect(await isUncovered(testRequest)).toBe(true)
  })

  test('keeps the typed question for when the field is focused again', async ({ page }) => {
    const operation = await getOperation(page)
    const field = operation.getByRole('textbox', { name: 'Ask AI Agent' })

    await field.focus()
    await page.keyboard.type('hello')
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')

    await expect(field).toBeFocused()
    await expect(field).toHaveValue('hello')
  })

  test('uncovers Test Request for the pointer when a typed question is left behind', async ({ page }) => {
    const operation = await getOperation(page)
    const testRequest = operation.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })

    await operation.getByText('Ask AI Agent', { exact: true }).click()
    await page.keyboard.type('hello')
    await operation.getByRole('heading', { name: 'Create a user' }).click()

    expect(await isUncovered(testRequest)).toBe(true)
  })
})
