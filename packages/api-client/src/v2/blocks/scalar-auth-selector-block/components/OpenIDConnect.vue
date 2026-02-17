<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { type OpenIdConnectObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { DataTableRow } from '@/components/DataTable'
import { fetchOpenIDConnectDiscovery } from '@/v2/blocks/scalar-auth-selector-block/helpers/fetch-openid-connect-discovery'
import { openIDDiscoveryToFlows } from '@/v2/blocks/scalar-auth-selector-block/helpers/openid-discovery-to-flows'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { environment, eventBus, getStaticBorderClass, name, scheme, proxyUrl } =
  defineProps<{
    /** Current environment configuration */
    environment: XScalarEnvironment
    /** Event bus for authentication updates */
    eventBus: WorkspaceEventBus
    /** Get the static border class */
    getStaticBorderClass: () => string | false
    /** Name of the security scheme */
    name: string
    /** Proxy URL */
    proxyUrl: string
    /** OpenID Connect scheme */
    scheme: OpenIdConnectObject
  }>()

const loader = useLoadingState()
const { toast } = useToasts()

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
  await loader.clear()

  // Toast for error
  if (error) {
    console.error(error)
    toast(
      error?.message ?? 'Failed to fetch OpenID Connect configuration',
      'error',
    )
    return
  }

  /** Set the newly discovered params in the secret store */
  const openIdConnect = openIDDiscoveryToFlows(_discovery)
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: openIdConnect,
    name,
    overwrite: true,
  })
}

const handleUpdateOpenIdConnectUrl = (value: string): void =>
  eventBus.emit('auth:update:security-scheme', {
    payload: {
      type: 'openIdConnect',
      openIdConnectUrl: value,
    },
    name,
  })
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
</template>
