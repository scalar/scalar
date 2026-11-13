import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { DataTable } from '@/v2/components/data-table'

import RequestAuthTab from './RequestAuthTab.vue'

const authorizationCode = {
  authorizationUrl: 'https://example.com/authorize',
  tokenUrl: 'https://example.com/token',
  scopes: { 'read:planets': 'Read planets' },
}

/** Server-renders the auth form of one selected scheme inside its table, the way a reference page does. */
const renderAuthTable = (securitySchemes: Record<string, unknown>, selected: string): Promise<string> =>
  renderToString(
    createSSRApp({
      render: () =>
        h(DataTable, { columns: [''], presentational: true }, () =>
          h(RequestAuthTab, {
            proxyUrl: '',
            environment: { color: '#FFFFFF', variables: [], description: '' },
            isStatic: true,
            selectedSecuritySchemas: { [selected]: [] },
            // The fixtures cover scheme types the form only shows a hint for
            securitySchemes: securitySchemes as never,
            eventBus: createWorkspaceEventBus(),
            server: { url: 'https://example.com' },
          }),
        ),
    }),
  )

/**
 * The HTML parser moves anything that is not a cell out of a table row, and anything that is not
 * a row out of a table body. Markup like that hydrates into a tree the client never built, so
 * the whole auth table is discarded and rebuilt.
 */
describe('RequestAuthTab.ssr', () => {
  it.each([
    [
      'a bearer token with an OAuth 2.0 shortcut',
      'bearerAuth',
      {
        bearerAuth: { type: 'http', scheme: 'bearer', 'x-scalar-secret-token': '' },
        oAuth2: { type: 'oauth2', flows: { authorizationCode } },
      },
    ],
    ['an OAuth 2.0 flow', 'oAuth2', { oAuth2: { type: 'oauth2', flows: { authorizationCode } } }],
    [
      'several OAuth 2.0 flows',
      'oAuth2',
      {
        oAuth2: {
          type: 'oauth2',
          flows: { authorizationCode, clientCredentials: { tokenUrl: 'https://example.com/token', scopes: {} } },
        },
      },
    ],
    [
      'OAuth 2.0 metadata discovery',
      'oAuth2',
      {
        oAuth2: {
          type: 'oauth2',
          oauth2MetadataUrl: 'https://example.com/.well-known/oauth-authorization-server',
          flows: { authorizationCode },
        },
      },
    ],
    [
      'OpenID Connect discovery',
      'openId',
      { openId: { type: 'openIdConnect', openIdConnectUrl: 'https://example.com/.well-known/openid-configuration' } },
    ],
    ['credentials the browser cannot send', 'broker', { broker: { type: 'userPassword' } }],
    ['mutual TLS', 'mtls', { mtls: { type: 'mutualTLS' } }],
    ['an unsupported scheme type', 'custom', { custom: { type: 'somethingElse' } }],
    ['a scheme without a type', 'empty', { empty: {} }],
  ])('keeps %s inside the table', async (_label, selected, securitySchemes) => {
    const html = await renderAuthTable(securitySchemes, selected)

    // Parsing the markup must leave the table as the only child, with all of its text inside
    const container = document.createElement('div')
    container.innerHTML = html
    const wrapper = container.firstElementChild
    const table = container.querySelector('table')

    expect([...(wrapper?.children ?? [])]).toStrictEqual([table])
    expect(table?.textContent).toBe(wrapper?.textContent)
    expect(table?.textContent?.trim()).not.toBe('')
  })
})
