import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const paths = {
  '/items': {
    get: { tags: ['Items'], summary: 'List items', responses: { '200': { description: 'OK' } } },
  },
  '/status': {
    get: { tags: ['Other'], summary: 'Read status', responses: { '200': { description: 'OK' } } },
  },
}

const documents = [
  {
    name: 'legacy groups',
    ancestors: ['Catalog', 'Items'],
    content: {
      openapi: '3.1.2',
      info: { title: 'Catalog API', version: '1.0.0' },
      tags: [{ name: 'Items' }, { name: 'Other' }],
      'x-tagGroups': [
        { name: 'Catalog', tags: ['Items'] },
        { name: 'Other group', tags: ['Other'] },
      ],
      paths,
    },
  },
  {
    name: 'nested parents',
    ancestors: ['Catalog', 'Inventory', 'Items'],
    content: {
      openapi: '3.2.1',
      info: { title: 'Catalog API', version: '1.0.0' },
      tags: [
        { name: 'Catalog' },
        { name: 'Inventory', parent: 'Catalog' },
        { name: 'Items', parent: 'Inventory' },
        { name: 'Other' },
      ],
      paths: {
        ...paths,
        '/inventory': {
          get: { tags: ['Inventory'], summary: 'Read inventory', responses: { '200': { description: 'OK' } } },
        },
      },
    },
  },
]

for (const { name, content, ancestors } of documents) {
  test(`folds ${name} with the keyboard and reveals deep links and search results`, async ({ page }) => {
    const example = await serveExample({ content, defaultOpenFirstTag: false })
    await page.goto(example)
    const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
    await expect(sidebar.getByRole('link', { name: 'Items', exact: true })).toHaveCount(0)

    for (const title of ancestors) {
      const toggle = sidebar.getByRole('button', { name: `Open Group - ${title}`, exact: true })
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(toggle).toHaveCount(0)
      await expect(sidebar.getByRole('button', { name: `Close Group - ${title}`, exact: true })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
    }
    const operation = sidebar.getByRole('link', { name: 'List items HTTP Method: GET', exact: true })
    const href = await operation.getAttribute('href')
    expect(href).not.toBeNull()

    const rootToggle = sidebar.getByRole('button', { name: 'Close Group - Catalog', exact: true })
    await rootToggle.focus()
    await page.keyboard.press('Space')
    await expect(operation).toHaveCount(0)
    await page.keyboard.press('Space')
    await expect(operation).toBeVisible()

    await page.goto(new URL(href!, example).href)
    await expect(operation).toHaveAttribute('aria-current', 'page')
    for (const title of ancestors) {
      await expect(sidebar.getByRole('button', { name: `Close Group - ${title}`, exact: true })).toBeVisible()
    }

    await sidebar.getByRole('button', { name: 'Close Group - Catalog', exact: true }).click()
    await expect(operation).toHaveCount(0)
    await page.getByRole('button', { name: /Search/ }).click()
    const search = page.getByRole('combobox')
    await search.fill('List items')
    await expect(page.getByRole('option', { name: /List items/ })).toBeVisible()
    await search.press('ArrowDown')
    await search.press('Enter')
    await expect(operation).toBeVisible()
    await expect(operation).toHaveAttribute('aria-current', 'page')
  })

  test(`respects initial expansion settings for ${name}`, async ({ page }) => {
    const example = await serveExample({ content })
    await page.goto(example)
    const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
    await expect(sidebar.getByRole('button', { name: 'Close Group - Catalog', exact: true })).toBeVisible()
    await expect(sidebar.getByRole('button', { name: `Open Group - ${ancestors[1]}`, exact: true })).toBeVisible()

    const allOpen = await serveExample({ content, defaultOpenAllTags: true })
    await page.goto(allOpen)
    for (const title of ancestors) {
      await expect(sidebar.getByRole('button', { name: `Close Group - ${title}`, exact: true })).toBeVisible()
    }
    await expect(sidebar.getByRole('link', { name: 'List items HTTP Method: GET', exact: true })).toBeVisible()
  })
}

test('reveals a folded group when scrolling to a different operation', async ({ page }) => {
  const example = await serveExample({ content: documents[0]!.content, defaultOpenAllTags: true })
  await page.goto(example)
  const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
  const items = sidebar.getByRole('link', { name: 'List items HTTP Method: GET', exact: true })
  await sidebar.getByRole('button', { name: 'Close Group - Catalog', exact: true }).click()
  await page.mouse.wheel(0, 1)
  await expect(sidebar.getByRole('button', { name: 'Open Group - Catalog', exact: true })).toBeVisible()

  await page
    .getByRole('region', { name: 'Read status', exact: true })
    .evaluate((element) => element.scrollIntoView({ block: 'start' }))
  await expect(sidebar.getByRole('link', { name: 'Read status HTTP Method: GET', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page
    .getByRole('region', { name: 'List items', exact: true })
    .evaluate((element) => element.scrollIntoView({ block: 'start' }))
  await expect(items).toBeVisible()
  await expect(items).toHaveAttribute('aria-current', 'page')
})
