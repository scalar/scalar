import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { Theme } from '@scalar/themes'
import { createApp } from 'vue'
import { createRouter as createVueRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'
import App from '@/v2/features/app/App.vue'
import { createAppState } from '@/v2/features/app/app-state'
import { ROUTES } from '@/v2/features/app/helpers/routes'
import type { ImportDocumentFromRegistry } from '@/v2/types/configuration'
import type { ClientLayout } from '@/v2/types/layout'

import { useCommandPaletteState } from '../../command-palette/hooks/use-command-palette-state'

type CreateApiClientOptions = {
  /**
   * The layout of the client, limited to web or desktop in app
   * @see {@link ClientLayout}
   *
   * @default 'desktop'
   */
  layout: Exclude<ClientLayout, 'modal'>
  /**
   * Api client plugins to include in the app
   */
  plugins?: ClientPlugin[]
  /**
   * Custom themes to include in the app
   */
  customThemes?: Theme[]
  /**
   * Fallback theme slug to use if no theme is selected for the workspace
   * @default 'default'
   */
  fallbackThemeSlug?: () => string
  /**
   * Fetches the full document from registry by meta. When set, registry meta takes priority
   * over x-scalar-original-source-url when syncing. Returns the document as a plain object.
   */
  fetchRegistryDocument?: ImportDocumentFromRegistry
  /**
   * Whether or not to send telemetry events.
   */
  telemetry?: boolean
  /** Optional OAuth2 redirect URI override for auth prefill */
  oauth2RedirectUri?: string
  /** Runtime behaviour overrides */
  options?: ApiClientAppOptions
}

/**
 * Runtime behaviour overrides shared between createApiClientApp and createAppState.
 */
export type ApiClientAppOptions = {
  /**
   * Custom fetch implementation used for all outgoing API requests and OpenAPI document loading.
   * When provided, this replaces the global fetch for both the workspace store (document fetching)
   * and the request execution engine (sendRequest).
   */
  customFetch?: CustomFetch
}

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createAppRouter = (layout: CreateApiClientOptions['layout']) => {
  // Web uses the standard HTML5 history API
  if (layout === 'web') {
    return createVueRouter({ history: createWebHistory(), routes: ROUTES })
  }

  // Electron app has to use the webHashHistory due to file routing
  return createVueRouter({ history: createWebHashHistory(), routes: ROUTES })
}

/**
 * Create the API Client with router and passes in the workspace store as a prop
 */
export const createApiClientApp = async (
  el: HTMLElement | null,
  {
    layout = 'desktop',
    plugins,
    customThemes,
    fallbackThemeSlug,
    fetchRegistryDocument,
    telemetry = true,
    oauth2RedirectUri,
    options,
  }: CreateApiClientOptions,
) => {
  // Add the router
  const router = createAppRouter(layout)
  const state = await createAppState({
    router,
    customThemes,
    fallbackThemeSlug,
    telemetryDefault: telemetry,
    oauth2RedirectUri,
    options,
  })
  const commandPaletteState = useCommandPaletteState()

  // Pass in our initial props at the top level
  const app = createApp(App, {
    layout,
    plugins,
    getAppState: () => state,
    getCommandPaletteState: () => commandPaletteState,
    fetchRegistryDocument,
  })
  app.use(router)

  // Mount the vue app
  if (!el) {
    console.error(
      '[@scalar/api-client-modal] Could not create the API client.',
      'Invalid HTML element provided.',
      'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
    )

    return
  }
  app.mount(el)

  return {
    app,
    state,
  }
}
