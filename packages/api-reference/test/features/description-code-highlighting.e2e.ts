import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test('highlights fenced code and honors custom link colors in request body and property descriptions', async ({
  page,
}) => {
  const snippet = '```js\nlet a = 5;\n```'
  const example = await serveExample({
    content: {
      openapi: '3.1.2',
      info: { title: 'Messages API', version: '1.0.0' },
      paths: {
        '/messages': {
          post: {
            summary: 'Create a message',
            requestBody: {
              description: 'Request body prose.\n\n[Details](/details)\n\n' + snippet,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        description: 'Property prose.\n\n[Details](/details)\n\n' + snippet,
                      },
                    },
                  },
                },
              },
            },
            responses: { '204': { description: 'Created' } },
          },
        },
      },
    },
    customCss: `
      .scalar-app .request-body-description,
      .scalar-app .property-description {
        --scalar-code-keyword: rgb(90, 33, 153);
        --scalar-color-2: rgb(112, 112, 112);
      }

      .scalar-app .request-body-description .markdown :where(a),
      .scalar-app .property-description :where(a) {
        color: rgb(180, 40, 40) !important;
      }
    `,
  })
  await page.goto(`${example}#tag/default/POST/messages`)

  const requestBody = page.getByRole('group', { name: 'Request Body', exact: true })
  for (const [selector, prose] of [
    ['.request-body-description', 'Request body prose.'],
    ['.property-description', 'Property prose.'],
  ] as const) {
    const description = requestBody.locator(selector)
    await expect(description.locator('pre code').getByText('let', { exact: true })).toHaveCSS(
      'color',
      'rgb(90, 33, 153)',
    )
    await expect(description.getByText(prose, { exact: true })).toHaveCSS('color', 'rgb(112, 112, 112)')
    await expect(description.getByRole('link', { name: 'Details', exact: true })).toHaveCSS('color', 'rgb(180, 40, 40)')
  }
})
