import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test('opens and closes an operation by clicking its caret', async ({ page }) => {
  const example = await serveExample({
    layout: 'classic',
    content: {
      openapi: '3.1.2',
      info: { title: 'Accordion interactions', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            responses: { '200': { description: 'A list of pets' } },
          },
        },
      },
    },
  })

  await page.goto(example)

  const accordion = page.locator('.section-accordion').filter({ hasText: 'List pets' }).first()
  const toggle = accordion.locator('.section-accordion-button')
  const caret = accordion.locator('.section-accordion-chevron')

  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  // Click the coordinates a user sees, including when the rotated icon paints above the toggle.
  for (const expanded of ['true', 'false']) {
    const bounds = await caret.boundingBox()
    if (!bounds) {
      throw new Error('The operation caret is not visible')
    }
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await expect(toggle).toHaveAttribute('aria-expanded', expanded)
  }
})

test('turns each picker caret with its own menu inside an open operation', async ({ page }) => {
  const example = await serveExample({
    layout: 'classic',
    content: {
      openapi: '3.1.2',
      info: { title: 'Accordion pickers', version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            summary: 'Add a pet',
            requestBody: {
              content: {
                'application/json': {
                  examples: {
                    cat: { summary: 'Cat', value: { name: 'Whiskers' } },
                    dog: { summary: 'Dog', value: { name: 'Rex' } },
                  },
                },
              },
            },
            responses: { '200': { description: 'Added' } },
          },
        },
      },
    },
  })

  await page.goto(example)

  const accordion = page.locator('.section-accordion').filter({ hasText: 'Add a pet' }).first()
  const toggle = accordion.locator('.section-accordion-button')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  // The open accordion is a Headless UI ancestor of both pickers, so a caret that reads the nearest
  // open state would point up while its own menu is closed. Each caret has to follow its own menu.
  for (const testId of ['client-picker', 'example-picker']) {
    const picker = accordion.getByTestId(testId)
    const caret = picker.locator('svg').last()

    await expect(picker).toHaveAttribute('aria-expanded', 'false')
    await expect(caret).toHaveCSS('rotate', 'none')

    // Mouse
    await picker.click()
    await expect(picker).toHaveAttribute('aria-expanded', 'true')
    await expect(caret).toHaveCSS('rotate', '180deg')
    await picker.click()
    await expect(picker).toHaveAttribute('aria-expanded', 'false')
    await expect(caret).toHaveCSS('rotate', 'none')

    // Keyboard
    await picker.focus()
    await page.keyboard.press('Enter')
    await expect(picker).toHaveAttribute('aria-expanded', 'true')
    await expect(caret).toHaveCSS('rotate', '180deg')
    await page.keyboard.press('Escape')
    await expect(picker).toHaveAttribute('aria-expanded', 'false')
    await expect(caret).toHaveCSS('rotate', 'none')
  }
})
