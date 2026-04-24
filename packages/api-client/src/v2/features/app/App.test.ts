import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceStorePersistence } from '@scalar/workspace-store/persistence'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import 'fake-indexeddb/auto'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'
import { useCommandPaletteState } from '@/v2/features/command-palette/hooks/use-command-palette-state'

import App from './App.vue'
import { createAppState } from './app-state'
import { ROUTES } from './helpers/routes'

/** Minimal valid OpenAPI document used for mock fetch responses */
const MOCK_OPENAPI_DOC = {
  openapi: '3.1.0',
  info: { title: 'Mock API', version: '1.0.0' },
  paths: {},
}

/**
 * Critical tests for the main App component
 * Tests focus on core functionality like theme generation, environment merging, and layout rendering
 */
describe('App', () => {
  const WORKSPACE_TEAM_SLUG = 'local'
  const WORKSPACE_SLUG = 'default'
  const DOCUMENT_ID = 'doc1'
  const OAUTH_SCHEME_NAME = 'OAuth2Auth'
  const OAUTH_REDIRECT_URI = 'myapp://oauth/callback'

  const setupWorkspace = async () => {
    const store = createWorkspaceStore()
    // Configure workspace-level settings

    store.workspace['x-scalar-active-environment'] = 'prod'
    store.workspace['x-scalar-environments'] = {
      prod: {
        color: '#FFFFFF',
        variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
      },
    }
    store.workspace['x-scalar-theme'] = 'default'
    store.workspace['x-scalar-sidebar-width'] = 300

    // Add a document with its own environment overrides
    await store.addDocument({
      name: DOCUMENT_ID,
      document: {
        openapi: '3.1.0',
        info: { title: 'Test Document', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              operationId: 'getPets',
              responses: {},
            },
          },
        },
        security: [{ [OAUTH_SCHEME_NAME]: [] }],
        components: {
          securitySchemes: {
            [OAUTH_SCHEME_NAME]: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://example.com/oauth/authorize',
                  tokenUrl: 'https://example.com/oauth/token',
                  scopes: {
                    read: 'Read access',
                  },
                },
              },
            },
          },
        },
        'x-scalar-environments': {
          prod: {
            variables: [{ name: 'API_KEY', value: 'prod-key-123' }],
          },
        },
      } as any,
    })

    const persistence = await createWorkspaceStorePersistence()
    await persistence.workspace.setItem(
      { teamSlug: WORKSPACE_TEAM_SLUG, slug: WORKSPACE_SLUG },
      {
        name: 'Default',
        workspace: store.exportWorkspace(),
      },
    )
  }

  const setupApp = async ({
    layout = 'web',
    oauth2RedirectUri,
    customFetch,
    routeName = 'document.overview',
  }: {
    layout?: 'web' | 'desktop'
    oauth2RedirectUri?: string
    customFetch?: CustomFetch
    routeName?: 'document.overview' | 'document.authentication'
  } = {}) => {
    await setupWorkspace()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: ROUTES,
    })

    const appState = await createAppState({ router, options: { oauth2RedirectUri, customFetch } })

    await router.push({
      name: routeName,
      params: { teamSlug: WORKSPACE_TEAM_SLUG, workspaceSlug: WORKSPACE_SLUG, documentSlug: DOCUMENT_ID },
    })

    await router.isReady()

    const commandPaletteState = useCommandPaletteState()

    const wrapper = mount(App, {
      props: {
        layout,
        getAppState: () => appState,
        getCommandPaletteState: () => commandPaletteState,
      },
      global: {
        plugins: [router],
      },
    })

    await nextTick()
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { wrapper, appState, router }
  }

  it('generates theme style tag from workspace theme configuration', async () => {
    const { wrapper } = await setupApp()

    /**
     * Theme styles should be dynamically generated based on the workspace theme ID
     * This is critical for maintaining consistent theming across the application
     */
    const html = wrapper.html()
    expect(html).toContain('<style id="scalar-theme" data-testid="default">')
  })

  it('merges workspace and document environment variables correctly', async () => {
    const { appState } = await setupApp()

    /**
     * Environment variables from both workspace and document levels should be merged
     * This ensures that document-specific overrides work correctly with workspace defaults
     */
    expect(appState.store.value?.workspace['x-scalar-environments']).toEqual({
      prod: {
        color: '#FFFFFF',
        variables: [{ name: 'BASE_URL', value: 'https://api.prod.com' }],
      },
    })
    expect(appState.environment.value.variables).toHaveLength(2)
    expect(appState.environment.value.variables?.[0]?.name).toBe('BASE_URL')
    expect(appState.environment.value.variables?.[1]?.name).toBe('API_KEY')
  })

  it('selects the correct document based on route params', async () => {
    const { appState } = await setupApp()

    /**
     * The document should be selected based on the route slug parameter
     * This is critical for displaying the correct document in the editor
     */
    expect(appState.document.value).toBeDefined()
    expect(appState.document.value?.info.title).toBe('Test Document')
  })

  it('prefills OAuth redirect URI from createAppState oauth2RedirectUri option in auth flow', async () => {
    const { wrapper, appState } = await setupApp({
      oauth2RedirectUri: OAUTH_REDIRECT_URI,
      routeName: 'document.authentication',
    })

    await nextTick()
    await flushPromises()

    const savedOAuthSecrets = appState.store.value?.auth.getAuthSecrets(DOCUMENT_ID, OAUTH_SCHEME_NAME)
    expect(savedOAuthSecrets).toMatchObject({
      type: 'oauth2',
      authorizationCode: {
        'x-scalar-secret-redirect-uri': OAUTH_REDIRECT_URI,
      },
    })

    expect(wrapper.text()).toContain('Authentication')
  })

  it('stores the provided customFetch in appState options', async () => {
    const customFetch = vi.fn() as unknown as CustomFetch
    const { appState } = await setupApp({ customFetch })

    expect(appState.options?.customFetch).toBe(customFetch)
  })

  it('customFetch is undefined in appState options when not provided', async () => {
    const { appState } = await setupApp()

    expect(appState.options?.customFetch).toBeUndefined()
  })

  it('workspace store uses customFetch when loading a document from URL', async () => {
    const customFetch = vi.fn<CustomFetch>().mockResolvedValue(
      new Response(JSON.stringify(MOCK_OPENAPI_DOC), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { appState } = await setupApp({ customFetch })

    await appState.store.value?.addDocument({
      name: 'remote-api',
      url: 'https://example.com/openapi.json',
    })

    expect(customFetch).toHaveBeenCalledTimes(1)
    expect(customFetch).toHaveBeenCalledWith('https://example.com/openapi.json', { headers: undefined })
  })

  it('workspace store uses global fetch when customFetch is not provided', async () => {
    const globalFetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_OPENAPI_DOC), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const { appState } = await setupApp()

    await appState.store.value?.addDocument({
      name: 'remote-api',
      url: 'https://example.com/openapi.json',
    })

    expect(globalFetchSpy).toHaveBeenCalledWith('https://example.com/openapi.json', { headers: undefined })
    globalFetchSpy.mockRestore()
  })
})
