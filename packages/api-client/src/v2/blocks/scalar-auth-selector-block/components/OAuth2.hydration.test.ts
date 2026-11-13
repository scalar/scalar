import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OAuthFlowsObjectSecret } from '@scalar/workspace-store/request-example'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { DataTable } from '@/v2/components/data-table'

import OAuth2 from './OAuth2.vue'

/** The default redirect URL comes from the address bar, which only the browser has. */
const browserDefault = vi.hoisted(() => ({ redirectUri: '' }))
vi.mock('@/v2/blocks/scalar-auth-selector-block/helpers/resolve-default-oauth2-redirect-url', () => ({
  resolveDefaultOAuth2RedirectUri: () => browserDefault.redirectUri,
}))

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const flows: OAuthFlowsObjectSecret = {
  authorizationCode: {
    authorizationUrl: 'https://example.com/authorize',
    tokenUrl: 'https://example.com/token',
    refreshUrl: '',
    scopes: {},
    'x-usePkce': 'no',
    'x-scalar-secret-client-id': '',
    'x-scalar-secret-client-secret': '',
    'x-scalar-secret-redirect-uri': '',
    'x-scalar-secret-token': '',
    'x-scalar-secret-refresh-token': '',
  },
}

describe('OAuth2 hydration', () => {
  it('renders the redirect URL field the same way on the server and in the browser', async () => {
    const createApp = () =>
      createSSRApp({
        render: () =>
          h(DataTable, { columns: [''], presentational: true }, () =>
            h(OAuth2, {
              environment: { color: '#FFFFFF', variables: [], description: '' },
              eventBus: createWorkspaceEventBus(),
              flows,
              name: 'oAuth2',
              options: {},
              proxyUrl: '',
              scheme: { type: 'oauth2', flows },
              selectedScopes: [],
              server: null,
              type: 'authorizationCode',
            }),
          ),
      })
    browserDefault.redirectUri = ''
    const html = await renderToString(createApp())
    browserDefault.redirectUri = 'https://docs.example.com/reference'
    const element = document.createElement('div')
    element.innerHTML = html
    document.body.append(element)
    const serverButtons = element.querySelectorAll('button').length
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const app = createApp()
    try {
      app.mount(element)
      expect(element.querySelectorAll('button').length).toBe(serverButtons)
      await nextTick()
      const hydrationMessages = [...warn.mock.calls, ...error.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
    } finally {
      app.unmount()
    }
  })
})
