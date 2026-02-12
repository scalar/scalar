<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenIdConnectObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { ref } from 'vue'

import { DataTableRow } from '@/components/DataTable'
import { fetchOpenIDConnectDiscovery } from '@/v2/blocks/scalar-auth-selector-block/helpers/fetch-openid-connect-discovery'
import type { OAuthFlowsObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import OAuth2 from './OAuth2.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  environment,
  eventBus,
  getStaticBorderClass,
  name,
  scheme,
  server,
  proxyUrl,
} = defineProps<{
  /** Current environment configuration */
  environment: XScalarEnvironment
  /** Event bus for authentication updates */
  eventBus: WorkspaceEventBus
  /** Get the static border class */
  getStaticBorderClass: () => string | false
  /** Name of the security scheme */
  name: string
  /** Current server configuration */
  server: ServerObject | null
  /** Proxy URL */
  proxyUrl: string
  /** OpenID Connect scheme */
  scheme: OpenIdConnectObject
}>()

const loader = useLoadingState()
const { toast } = useToasts()
const flows = ref<OAuthFlowsObjectSecret | null>(null)
const scopes = ref<string[]>([])

/**
 * Fetches the OpenID Connect discovery document and triggers authorization
 */
const handleOpenIdConnect = async (): Promise<void> => {
  if (loader.isLoading || !scheme.openIdConnectUrl) {
    return
  }

  loader.start()
  const [error, _discovery] = await fetchOpenIDConnectDiscovery(
    scheme.openIdConnectUrl,
    proxyUrl,
  )

  // Toast for error
  if (error) {
    console.error(error)
    toast(
      error?.message ?? 'Failed to fetch OpenID Connect configuration',
      'error',
    )
    return
  }

  await loader.clear()
}

const handleUpdateOpenIdConnectUrl = (value: string): void =>
  eventBus.emit(
    'auth:update:security-scheme',
    {
      payload: {
        type: 'openIdConnect',
        openIdConnectUrl: value,
      },
      name,
    },
    { debounceKey: `openIdConnectUrl-${name}` },
  )
</script>

<template>
  <DataTableRow>
    <RequestAuthDataTableInput
      :containerClass="getStaticBorderClass()"
      :environment
      :modelValue="scheme.openIdConnectUrl"
      placeholder="https://example.com/.well-known/openid-configuration"
      required
      @update:modelValue="handleUpdateOpenIdConnectUrl">
      Discovery URL
    </RequestAuthDataTableInput>
  </DataTableRow>

  <DataTableRow class="min-w-full">
    <div class="flex h-8 w-full items-center justify-end border-t">
      <ScalarButton
        class="mr-0.75 p-0 px-2 py-0.5"
        :disabled="!scheme.openIdConnectUrl"
        :loader
        size="sm"
        variant="outlined"
        @click="handleOpenIdConnect">
        Fetch Configuration
      </ScalarButton>
    </div>
  </DataTableRow>

  <!-- OAuth2 flow configuration -->
  <template
    v-for="(_flow, key) in flows"
    :key="key">
    <OAuth2
      v-if="flows"
      :environment
      :eventBus
      :flows
      :name
      :proxyUrl
      :selectedScopes="scopes"
      :server="server"
      :type="key"
      @update:selectedScopes="(event) => console.log(name, event)" />
  </template>
</template>
