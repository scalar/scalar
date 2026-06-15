import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/**
 * Mocks for lazy loading, remove after lazy bus is fixed.
 *
 * Runs idle/animation/timeout callbacks (almost) immediately so the lazy bus
 * settles deterministically within the test.
 */
const mockLazyTimers = (page: Page) =>
  page.addInitScript(() => {
    // Mock requestIdleCallback to run immediately
    window.requestIdleCallback = (cb: IdleRequestCallback): number => {
      cb({
        didTimeout: false,
        timeRemaining: () => 0,
      } as IdleDeadline)
      return 1
    }

    // Mock requestAnimationFrame to run immediately
    const originalRAF = window.requestAnimationFrame
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      setTimeout(() => callback(performance.now()), 0)
      return originalRAF(callback)
    }

    // Mock setTimeout to run faster in tests
    const originalSetTimeout = window.setTimeout
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: any[]) => {
      const testDelay = delay ? Math.min(delay / 10, 10) : 0
      return originalSetTimeout(callback, testDelay, ...args)
    }) as typeof setTimeout
  })

test.describe('parameter linking', () => {
  /* We need to retry this test because it's flaky on CI */
  test.describe.configure({ retries: 3 })

  test.use({
    permissions: ['clipboard-write', 'clipboard-read'],
  })

  test('requestBody parameters have anchor links', async ({ page }) => {
    await mockLazyTimers(page)

    const example = await serveExample({
      // If it works with pathRouting, it probably works without it too.
      pathRouting: {
        basePath: '/custom-base-path',
      },
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get all users',
              tags: ['user-tag'],
              parameters: [
                {
                  name: 'myCustomQueryParameter',
                  in: 'query',
                  required: true,
                },
                {
                  name: 'myCustomHeaderParameter',
                  in: 'header',
                  required: true,
                },
                {
                  name: 'myCustomPathParameter',
                  in: 'path',
                  required: true,
                },
                {
                  name: 'myCustomCookieParameter',
                  in: 'cookie',
                  required: true,
                },
              ],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myCustomBodyParameter: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Set viewport to a small height to test that the button is not in the viewport
    await page.setViewportSize({ width: 1024, height: 400 })
    await page.goto(example)

    // Before
    await page.hover('text=myCustomBodyParameter')

    const button = page.getByRole('button', { name: 'Copy link to myCustomBodyParameter', exact: true })
    await expect(button).toBeVisible()

    // Click
    await page.getByRole('button', { name: 'myCustomBodyParameter' }).click()
    await expect(button).toBeInViewport()

    // Should show a success message
    await expect(await page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible()

    // Scroll to the top of the page
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(button).not.toBeInViewport()

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain('myCustomBodyParameter')

    await page.goto(clipboard)

    await expect(button).toBeInViewport()
  })

  test('anchor links reveal requestBody parameters hidden in the collapsed section', async ({ page }) => {
    await mockLazyTimers(page)

    // More than 12 properties forces the overflow into a collapsed
    // "Show additional properties" section that is hidden by default.
    const properties = Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [
        `property${String(index + 1).padStart(2, '0')}`,
        { type: 'string' as const },
      ]),
    )
    /** The last property always lands in the collapsed (hidden) section. */
    const hiddenProperty = 'property13'

    const example = await serveExample({
      pathRouting: {
        basePath: '/custom-base-path',
      },
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get all users',
              tags: ['user-tag'],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    await page.setViewportSize({ width: 1024, height: 400 })
    await page.goto(example)

    const hiddenButton = page.getByRole('button', { name: `Copy link to ${hiddenProperty}`, exact: true })

    // The overflow property is hidden behind the collapsed section on load.
    await expect(hiddenButton).toHaveCount(0)

    // Expand the collapsed section to grab the canonical deep link.
    await page.getByRole('button', { name: /Show additional properties/ }).click()
    await page.hover(`text=${hiddenProperty}`)
    await hiddenButton.click()
    await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible()

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain(hiddenProperty)

    // Fresh navigation: the section starts collapsed again, but the deep link
    // must reveal the hidden property and scroll it into view.
    await page.goto(clipboard)

    await expect(hiddenButton).toBeInViewport()
  })
})
