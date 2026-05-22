import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('setPageTitle', () => {
  test('updates the tab title when a sidebar entry is selected', async ({ page }) => {
    const example = await serveExample({
      setPageTitle: ({ title }) => `API Reference - ${title}`,
      content: {
        openapi: '3.1.1',
        info: { title: 'Galaxy API', version: '1.0.0' },
        paths: {
          '/users': {
            post: { summary: 'Create a user', tags: ['Users'] },
          },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Create a user' }).click()

    await expect(page).toHaveTitle('API Reference - Create a user')
  })

  test('updates the tab title on scroll', async ({ page }) => {
    const example = await serveExample({
      // The document is exposed so the title can reflect which API is in view
      setPageTitle: ({ title, document }) => `${document.title} › ${title}`,
      defaultOpenAllTags: true,
      content: {
        openapi: '3.1.1',
        info: { title: 'Galaxy API', version: '1.0.0' },
        paths: {
          '/planets': {
            get: { summary: 'Get all planets', tags: ['Planets'] },
          },
          '/moons': {
            get: { summary: 'Get all moons', tags: ['Moons'] },
          },
        },
      },
    })

    // A small viewport keeps the section in view unambiguous
    await page.setViewportSize({ width: 1280, height: 600 })

    await page.goto(example)

    // On load the document start is in view, so the title reflects the document itself
    await expect(page).toHaveTitle('Galaxy API › Galaxy API')

    // Scrolling a later operation into view updates the title without any click
    await page
      .getByRole('heading', { name: 'Get all moons' })
      .evaluate((element) => element.scrollIntoView({ block: 'center' }))

    await expect(page).toHaveTitle('Galaxy API › Get all moons')
  })

  test('updates the tab title when switching documents', async ({ page }) => {
    const example = await serveExample({
      setPageTitle: ({ document }) => `Docs: ${document.title}`,
      sources: [
        {
          title: 'First API',
          slug: 'first',
          content: {
            openapi: '3.1.1',
            info: { title: 'First API', version: '1.0.0' },
            paths: { '/a': { get: { summary: 'Get A', tags: ['A'] } } },
          },
        },
        {
          title: 'Second API',
          slug: 'second',
          content: {
            openapi: '3.1.1',
            info: { title: 'Second API', version: '1.0.0' },
            paths: { '/b': { get: { summary: 'Get B', tags: ['B'] } } },
          },
        },
      ],
    })

    await page.goto(example)

    await expect(page).toHaveTitle('Docs: First API')

    // Switch documents through the sidebar document selector
    await page.locator('.document-selector').getByRole('button').click()
    await page.getByRole('option', { name: 'Second API' }).click()

    await expect(page).toHaveTitle('Docs: Second API')
  })
})
