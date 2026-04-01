import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('back navigation', () => {
  test('keeps tag section containers bounded after browser back on mobile', async ({ page }) => {
    test.fail(
      true,
      'Tracks #4269: some mobile back navigations can leave a tag section container larger than the references container.',
    )

    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Navigation regression API',
          version: '1.0.0',
        },
        paths: {
          '/top': {
            get: {
              summary: 'Top endpoint',
              tags: ['top-tag'],
              responses: {
                200: {
                  description: 'ok',
                },
              },
            },
          },
          '/middle': {
            get: {
              summary: 'Middle endpoint',
              tags: ['middle-tag'],
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '/bottom': {
            get: {
              summary: 'Bottom endpoint',
              tags: ['bottom-tag'],
              responses: {
                200: {
                  description: 'ok',
                },
              },
            },
          },
        },
      },
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${example}#tag/middle-tag/GET/middle`)

    await page.getByRole('heading', { name: 'Middle endpoint', level: 3 }).scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2))

    // Simulate navigating away and returning with browser back on mobile.
    await page.goto('about:blank')
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
    await expect(page.getByRole('heading', { name: 'Navigation regression API', level: 1 })).toBeInViewport()
  })
})
