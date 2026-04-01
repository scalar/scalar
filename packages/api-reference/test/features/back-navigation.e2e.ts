import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const getContent = () => {
  const paths = Object.fromEntries(
    Array.from({ length: 16 }, (_, index) => {
      const endpointNumber = `${index + 1}`.padStart(2, '0')
      const endpointPath = `/endpoint-${endpointNumber}`
      const tag = `tag-${endpointNumber}`

      return [
        endpointPath,
        {
          get: {
            summary: `Endpoint ${endpointNumber}`,
            description: 'A long description to force scroll height in the operation area. '.repeat(25),
            tags: [tag],
            responses: {
              200: {
                description: `Response for endpoint ${endpointNumber}`,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        status: { type: 'string' },
                        details: {
                          type: 'object',
                          properties: {
                            nested: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]
    }),
  )

  return {
    openapi: '3.1.1',
    info: {
      title: 'Navigation regression API',
      version: '1.0.0',
    },
    paths,
  }
}

test.describe('back navigation', () => {
  test('keeps tag section containers bounded after browser back on mobile', async ({ page }) => {
    test.fail(
      true,
      'Tracks #4269: mobile browser back can leave the document in a state where top content is no longer reachable.',
    )

    const example = await serveExample({
      content: getContent(),
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${example}#tag/tag-08/GET/endpoint-08`)

    await page.getByRole('heading', { name: 'Endpoint 08', level: 3 }).scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2))

    // Simulate navigating away and returning with browser back on mobile.
    await page.goto('data:text/html,<title>away</title><p>away</p>')
    await page.goBack()

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const referencesContainer = document.querySelector('.narrow-references-container')

          if (!referencesContainer) {
            return -1
          }

          const referencesContainerHeight = referencesContainer.getBoundingClientRect().height
          const oversizedTagSections = Array.from(document.querySelectorAll('.tag-section-container')).filter(
            (element) => element.getBoundingClientRect().height > referencesContainerHeight,
          )

          return oversizedTagSections.length
        }),
      )
      .toBe(0)

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(page.getByRole('heading', { name: 'Navigation regression API', level: 1 })).toBeInViewport()
    await expect(page.getByRole('heading', { name: 'tag-01', level: 2 })).toBeInViewport()
  })
})
