import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.0',
  info: { title: 'Pets API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        summary: 'List pets',
        responses: { '200': { description: 'A list of pets' } },
      },
    },
    '/pets/{id}': {
      get: {
        summary: 'Get a pet',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'A pet' } },
        'x-codeSamples': [{ lang: 'python', label: 'Pets SDK', source: 'pets.get(1)' }],
      },
    },
  },
}

const moreButtonName = /^(More|Select from all clients)/

test.describe('httpClients', () => {
  test('filters tabs, More, and operation pickers with the same allowlist', async ({ page }) => {
    const example = await serveExample({
      content,
      httpClients: ['node/fetch', 'node/undici', 'shell/*', 'shell/curl'],
      hiddenClients: ['shell/wget'],
      featuredClients: ['php/curl', 'node/fetch', 'shell/curl'],
      defaultHttpClient: 'node/fetch',
    })
    await page.goto(example)
    const tabs = page.getByRole('tablist', { name: 'Client Libraries' }).getByRole('tab')
    await expect(tabs).toHaveText(['Node.js', 'Shell'])
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')

    const operationPicker = page.getByLabel('List pets').getByTestId('client-picker')
    await expect(operationPicker).toHaveText('Node.js Fetch')

    const more = page.getByRole('button', { name: moreButtonName })
    await more.focus()
    await more.press('Enter')
    const options = page.getByRole('listbox').getByRole('option')
    await expect(options).toHaveCount(4)
    for (const name of ['Fetch', 'undici', 'Curl', 'HTTPie']) {
      await expect(page.getByRole('option', { name, exact: true })).toBeVisible()
    }
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await expect(more).toBeFocused()

    await operationPicker.click()
    await expect(options).toHaveCount(4)
    for (const name of ['Fetch', 'undici', 'Curl', 'HTTPie']) {
      await expect(page.getByRole('option', { name, exact: true })).toBeVisible()
    }
    await page.getByRole('option', { name: 'undici', exact: true }).click()
    await expect(operationPicker).toHaveText('Node.js undici')
  })

  test('falls back to an available client when the configured default is excluded', async ({ page }) => {
    await page.goto(
      await serveExample({
        content,
        httpClients: ['node/undici'],
        defaultHttpClient: 'node/fetch',
      }),
    )

    await expect(page.getByRole('tab', { name: 'Node.js' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel', { name: 'Node.js' })).toHaveText('Node.js undici')
    await expect(page.getByLabel('List pets').getByTestId('client-picker')).toHaveText('Node.js undici')
  })

  test('keeps an allowed non-featured client accessible through More', async ({ page }) => {
    await page.goto(await serveExample({ content, httpClients: ['node/fetch'] }))

    await expect(page.getByRole('tablist', { name: 'Client Libraries' })).toHaveCount(0)
    await expect(page.getByLabel('List pets').getByTestId('client-picker')).toHaveText('Node.js Fetch')
    await page.getByRole('button', { name: moreButtonName }).click()
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Fetch'])
  })

  test('an empty allowlist hides built-in clients and keeps custom code samples', async ({ page }) => {
    await page.goto(await serveExample({ content, httpClients: [], defaultHttpClient: 'node/fetch' }))

    await expect(page.getByRole('heading', { name: 'Pets API' })).toBeVisible()
    await expect(page.getByText('Client Libraries')).toHaveCount(0)
    await expect(page.getByLabel('List pets').getByTestId('client-picker')).toHaveCount(0)
    await expect(page.getByLabel('Get a pet').getByTestId('client-picker')).toHaveText('Pets SDK')
    await expect(page.getByText('pets.get(1)')).toBeVisible()
  })
})
