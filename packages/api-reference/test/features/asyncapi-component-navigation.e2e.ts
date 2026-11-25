import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  asyncapi: '3.1.0',
  info: { title: 'Component catalog', version: '1.0.0' },
  channels: {},
  components: {
    messages: {
      'Order.Created': { title: 'Order created', payload: { type: 'string' } },
      'Order.Created-content': { title: 'Legacy order event' },
    },
  },
}

test('keeps a single modern section anchor and moves focus into the opened group', async ({ page }) => {
  const example = await serveExample({ content, defaultOpenFirstTag: false })
  await page.goto(example)

  const section = page.getByRole('region', { name: 'Messages', exact: true })
  const expand = section.getByRole('button', { name: 'Show More Messages', exact: true })
  await expect(expand).toBeVisible()
  const id = await section.getAttribute('id')
  expect(id).toMatch(/\/~components\/messages$/)
  await expect(page.locator(`[id="${id}"]`)).toHaveCount(1)

  await expand.focus()
  await page.keyboard.press('Enter')
  await expect(section).toBeFocused()
  await page.keyboard.press('Tab')
  const message = section.getByRole('button', { name: 'Order created' })
  await expect(message).toBeFocused()
  await page.keyboard.press('Enter')

  const panelId = await message.getAttribute('aria-controls')
  await expect(section.locator(`[id="${panelId}"]`)).toBeVisible()
  const siblingId = `${id}/Order~002eCreated-content`
  await expect(section.getByRole('button', { name: 'Legacy order event' })).toHaveAttribute('id', siblingId)
  await expect(page.locator(`[id="${siblingId}"]`)).toHaveCount(1)
})

test('opens a classic component section from a deep link with an accurate expanded state', async ({ page }) => {
  const example = await serveExample({ content, defaultOpenFirstTag: false, layout: 'classic' })
  await page.goto(`${example}#~components/messages`)

  const section = page.getByRole('region', { name: 'Messages', exact: true })
  await expect(section.getByRole('heading', { name: 'Messages', exact: true })).toBeInViewport()
  const expand = section.getByRole('button', { name: 'Messages', exact: true })
  await expect(expand).toHaveAttribute('aria-expanded', 'true')

  await expand.focus()
  await page.keyboard.press('Space')
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expect(section.getByRole('heading', { name: 'Order created' })).toHaveCount(0)
})

test('keeps the mobile sidebar open when selecting a Messages section', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  const example = await serveExample({ content, defaultOpenFirstTag: false })
  await page.goto(example)

  await page.getByRole('button', { name: 'Open Menu' }).click()
  const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
  const group = sidebar.getByRole('link', { name: 'Messages', exact: true })
  await group.focus()
  await page.keyboard.press('Enter')
  await expect(group).toBeFocused()
  const message = sidebar.getByRole('link', { name: 'Order created', exact: true })
  await expect(message).toBeVisible()
  await message.click()

  await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Order created' })).toBeInViewport()
})

test('scrolls and focuses the desktop Messages section after the open mobile sidebar is resized', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  const example = await serveExample({ content, defaultOpenFirstTag: false })
  await page.goto(example)

  await page.getByRole('button', { name: 'Open Menu' }).click()
  await expect(page.getByRole('button', { name: 'Close Menu' })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 740 })

  const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
  await sidebar.getByRole('link', { name: 'Messages', exact: true }).click()

  const section = page.getByRole('region', { name: 'Messages', exact: true })
  await expect(section).toBeFocused()
  await expect(section.getByRole('heading', { name: 'Messages', exact: true })).toBeInViewport()
})

for (const layout of ['modern', 'classic'] as const) {
  test(`wraps long headings and example names at 320 CSS pixels in ${layout}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    const name = 'PlanetCreatedAfterSeveralEnvironmentalActionsAndChecks'.repeat(4)
    const exampleName = 'TraceHeaderExampleWithIdentifyingInformation'.repeat(6)
    const message = {
      description: 'Records a planet update.',
      headers: { type: 'object', properties: { traceId: { type: 'string' } } },
      examples: [
        { name: exampleName, headers: { traceId: 'first' } },
        { name: 'Alternate trace', headers: { traceId: 'second' } },
      ],
    }
    const example = await serveExample({
      layout,
      content: {
        ...content,
        components: {
          messages: { [name]: message },
        },
      },
    })

    await page.goto(`${example}#~components/messages/${name}`)
    const heading = page.getByRole('button', { name, exact: true })
    await expect(heading).toHaveAttribute('aria-expanded', 'true')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)

    const examples = page.getByRole('group', { name: 'Examples', exact: true })
    const picker = examples.getByRole('button', { name: `Examples: ${exampleName}`, exact: true })
    await expect(picker).toBeVisible()
    const header = examples.locator('.scalar-card-header')
    expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  })
}
