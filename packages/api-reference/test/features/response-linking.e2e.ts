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
    window.requestIdleCallback = (cb: IdleRequestCallback): number => {
      cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline)
      return 1
    }

    const originalRAF = window.requestAnimationFrame
    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      setTimeout(() => callback(performance.now()), 0)
      return originalRAF(callback)
    }

    const originalSetTimeout = window.setTimeout
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: any[]) => {
      const testDelay = delay ? Math.min(delay / 10, 10) : 0
      return originalSetTimeout(callback, testDelay, ...args)
    }) as typeof setTimeout
  })

test.describe('response linking', () => {
  /* We need to retry this test because it's flaky on CI */
  test.describe.configure({ retries: 3 })

  test('anchor links to response properties scroll into view on a fresh load', async ({ page }) => {
    await mockLazyTimers(page)

    // Enough filler operations that the target operation is offscreen (and
    // therefore lazily rendered as a placeholder) when the deep link loads.
    // This is the condition under which the bug appeared.
    const paths: Record<string, unknown> = {}
    for (let index = 0; index < 20; index++) {
      paths[`/filler-${index}`] = {
        get: { summary: `Filler ${index}`, tags: ['filler-tag'], responses: { '200': { description: 'OK' } } },
      }
    }
    paths['/target'] = {
      get: {
        summary: 'Get all users',
        tags: ['target-tag'],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    myCustomResponseProperty: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }

    const example = await serveExample({
      pathRouting: { basePath: '/custom-base-path' },
      // Response properties only render (and therefore have anchors) when the
      // responses are expanded.
      expandAllResponses: true,
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        paths,
      },
    })

    await page.setViewportSize({ width: 1024, height: 400 })
    await page.goto(`${example}/custom-base-path/tag/target-tag/GET/target`)

    // The response property has an anchor link.
    const button = page.getByRole('button', { name: 'Copy link to myCustomResponseProperty', exact: true })
    await expect(button).toBeVisible()

    // Read the anchor id and build a path-routing deep link from it.
    const anchorId = await page.locator('[id$=".responses.200.myCustomResponseProperty"]').first().getAttribute('id')
    expect(anchorId).toBeTruthy()
    const deepLink = `${example}/custom-base-path/${anchorId!.replace(/^[^/]+\//, '')}`

    // A fresh navigation must render the (lazy) operation and scroll the response
    // property into view.
    await page.goto(deepLink)

    await expect(page.locator(`[id="${anchorId}"]`)).toBeInViewport({ timeout: 6000 })
  })
})
