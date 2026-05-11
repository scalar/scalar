<script lang="ts">
/**
 * Operation example page
 *
 * Displays an operation with a specific example selected
 *  - View example request data
 *  - Modify example request data
 *  - Send example request
 */
export default {}

export type OperationProps = {
  /** The slug of the currently selected document in the workspace */
  documentSlug: string
  /** The currently active document — OpenAPI-only, the operation page has no AsyncAPI path */
  document: OpenApiDocument | null
  /** The workspace event bus */
  eventBus: WorkspaceEventBus
  /** The layout of the client */
  layout: ClientLayout
  /** The API path currently selected (e.g. "/users/{id}") */
  path?: string
  /** The HTTP method for the currently selected API path (e.g. GET, POST) */
  method?: HttpMethod
  /** The name of the currently selected example (for examples within an endpoint) */
  exampleName?: string
  /** The currently active environment */
  environment: XScalarEnvironment
  /** The workspace store */
  workspaceStore: WorkspaceStore
  /** Client plugins */
  plugins: ClientPlugin[]
  /** App or modal options forwarded to operation/auth blocks */
  options?: MaybeRefOrGetter<ApiClientOptions>
}
</script>

<script setup lang="ts">
import { isElectron } from '@scalar/helpers/general/is-electron'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getActiveProxyUrl,
  getRequestExampleContext,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { OperationBlock } from '@/v2/blocks/operation-block'
import { APP_VERSION } from '@/v2/constants'
import { mapHiddenClientsConfig } from '@/v2/features/modal/helpers/map-hidden-clients-config'
import type { ClientLayout } from '@/v2/types/layout'
import type { ApiClientOptions } from '@/v2/types/options'

const {
  document,
  layout,
  eventBus,
  path,
  method,
  environment,
  exampleName,
  options,
  workspaceStore,
  plugins,
  documentSlug,
} = defineProps<
  OperationProps & {
    /** Selected anyOf/oneOf request-body variants keyed by schema path */
    requestBodyCompositionSelection?: Record<string, number>
  }
>()

/**
 * Shared request-example context (operation, servers, auth scope, cookies). Recomputed when any
 * underlying workspace or route input changes — same reactivity as the previous local computeds.
 */
const requestExample = computed(() => {
  if (!path || !method || !exampleName || !document) {
    return null
  }

  const result = getRequestExampleContext(
    workspaceStore,
    documentSlug,
    { path, method, exampleName },
    {
      baseServerUrl: toValue(options)?.baseServerURL,
      fallbackDocument: document,
      isElectron: isElectron(),
      layout: layout === 'web' ? 'web' : 'other',
      servers: toValue(options)?.servers,
      appVersion: APP_VERSION,
      authentication: toValue(options)?.authentication,
    },
  )

  return result.ok ? result.data : null
})

const operation = computed(() => requestExample.value?.operation ?? null)
const workspaceCookies = computed(
  () => requestExample.value?.cookies.workspace ?? [],
)
const documentCookies = computed(
  () => requestExample.value?.cookies.document ?? [],
)
const servers = computed(() => requestExample.value?.servers.list ?? [])
const selectedServer = computed(
  () => requestExample.value?.servers.selected ?? null,
)
const serverMeta = computed(
  () => requestExample.value?.servers.meta ?? { type: 'document' as const },
)

const securitySchemes = computed(
  () => requestExample.value?.security.schemes ?? {},
)

const selectedSecurity = computed(
  () =>
    requestExample.value?.security.selected ?? {
      selectedIndex: -1,
      selectedSchemes: [],
    },
)
const selectedSecuritySchemes = computed(
  () => requestExample.value?.security.selectedSchemes ?? [],
)
const securityRequirements = computed(
  () => requestExample.value?.security.requirements ?? [],
)
const authMeta = computed(
  () => requestExample.value?.security.meta ?? { type: 'document' as const },
)

const defaultHeaders = computed(
  () => requestExample.value?.headers.default ?? {},
)

/** Combine environments from document and workspace into a unique array of environment names */
const environments = computed(() => {
  return Array.from(
    new Set(
      Object.keys({
        ...document?.['x-scalar-environments'],
        ...workspaceStore.workspace['x-scalar-environments'],
      }),
    ),
  )
})

/** Temporarily use the old config.hiddenClients until we migrate to the new httpClients config */
const httpClients = computed(() =>
  mapHiddenClientsConfig(toValue(options)?.hiddenClients),
)
</script>

<template>
  <!-- Operation exists -->
  <template v-if="path && method && exampleName && operation && document">
    <OperationBlock
      :activeEnvironment="
        workspaceStore.workspace['x-scalar-active-environment']
      "
      :appVersion="APP_VERSION"
      :authMeta
      :defaultHeaders
      :document
      :documentCookies
      :documentSecurity="document?.security ?? []"
      :documentSlug
      :documentUrl="document?.['x-scalar-original-source-url']"
      :environment
      :environments
      :eventBus
      :exampleKey="exampleName"
      :hideClientButton="toValue(options)?.hideClientButton ?? false"
      :history="workspaceStore.history.getHistory(documentSlug, path, method)"
      :httpClients
      :layout
      :method
      :operation
      :options
      :path
      :plugins="plugins"
      :proxyUrl="
        getActiveProxyUrl(
          workspaceStore.workspace['x-scalar-active-proxy'],
          layout === 'web' ? 'web' : 'other',
        ) ?? ''
      "
      :requestBodyCompositionSelection
      :securityRequirements="securityRequirements"
      :securitySchemes
      :selectedClient="workspaceStore.workspace['x-scalar-default-client']"
      :selectedSecurity="selectedSecurity"
      :selectedSecuritySchemes="selectedSecuritySchemes"
      :server="selectedServer"
      :serverMeta
      :servers
      :workspaceCookies />
  </template>

  <!-- Empty state -->
  <div
    v-else
    class="flex h-full w-full items-center justify-center">
    <span class="text-c-3">Select an operation to view details</span>
  </div>
</template>
