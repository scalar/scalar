import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('AsyncAPI native dependencies', () => {
  for (const language of ['RAML', 'Protobuf'] as const) {
    test(`renders resolved ${language} message fields and keeps missing dependencies as source`, async ({ page }) => {
      const files: Record<string, string> = {
        'https://native.example.test/raml/library.raml':
          '#%RAML 1.0 Library\ntypes:\n  User:\n    type: object\n    properties:\n      external_id: string',
        'https://native.example.test/proto/user.proto': 'syntax="proto3"; message User { string external_id=1; }',
      }
      const requested: string[] = []
      await page.route('https://native.example.test/**', (route) => {
        requested.push(route.request().url())
        const body = files[route.request().url()]
        return route.fulfill({
          status: body ? 200 : 404,
          body: body ?? 'Missing dependency',
          headers: { 'access-control-allow-origin': '*' },
        })
      })
      const format =
        language === 'RAML' ? 'application/raml+yaml;version=1.0' : 'application/vnd.google.protobuf;version=3'
      const schema =
        language === 'RAML'
          ? 'uses:\n  users: https://native.example.test/raml/library.raml\ntype: object\nproperties:\n  friends: users.User[]'
          : 'syntax="proto3"; import "https://native.example.test/proto/user.proto"; message Envelope { User user=1; }'
      const missing =
        language === 'RAML'
          ? '!include https://native.example.test/missing.raml'
          : 'syntax="proto3"; import "https://native.example.test/missing.proto"; message Missing { Absent user=1; }'
      const example = await serveExample({
        expandAllSchemaProperties: true,
        content: {
          asyncapi: '3.1.0',
          info: { title: 'Native dependencies', version: '1' },
          channels: {
            users: {
              address: 'users',
              messages: {
                imported: { title: `Imported ${language}`, payload: { schemaFormat: format, schema } },
                missing: { title: `Missing ${language}`, payload: { schemaFormat: format, schema: missing } },
              },
            },
          },
        },
      })
      await page.goto(example)
      const imported = page
        .getByRole('button')
        .filter({ hasText: `Imported ${language}` })
        .last()
      await expect(imported).toBeVisible()
      expect(requested).toEqual([])
      await test.info().attach('native-schemas-collapsed', {
        body: await page.screenshot({ fullPage: true, path: test.info().outputPath('native_schema_collapsed.png') }),
        contentType: 'image/png',
      })
      await page
        .getByRole('button')
        .filter({ hasText: `Imported ${language}` })
        .last()
        .click()
      await expect(page.getByText('external_id', { exact: true }).first()).toBeVisible()
      expect(requested).toEqual([
        `https://native.example.test/${language === 'RAML' ? 'raml/library.raml' : 'proto/user.proto'}`,
      ])
      await imported.click()
      await imported.click()
      await expect(page.getByText('external_id', { exact: true }).first()).toBeVisible()
      expect(requested.length).toBe(1)
      if (language === 'RAML') await expect(page.getByText('users.User', { exact: true }).first()).toBeVisible()
      await page
        .getByRole('button')
        .filter({ hasText: `Missing ${language}` })
        .last()
        .click()
      await expect(page.getByText(missing, { exact: true })).toBeVisible()
      expect(requested.length).toBe(2)
      await test.info().attach('native-schema-rendering', {
        body: await page.screenshot({ fullPage: true, path: test.info().outputPath('native_schema_expanded.png') }),
        contentType: 'image/png',
      })
    })
  }
})
