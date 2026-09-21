<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { useLoadingState } from '@scalar/components/loading'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OAuth2Object } from '@scalar/workspace-store/schemas/v3.2/strict/security-scheme'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'
import { fetchOAuth2Metadata } from '@/v2/blocks/scalar-auth-selector-block/helpers/fetch-oauth2-metadata'
import { oauth2MetadataToFlows } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth2-metadata-to-flows'
import { DataTableRow } from '@/v2/components/data-table'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { scheme, name, environment, eventBus, proxyUrl, customFetch } =
  defineProps<{
    scheme: OAuth2Object
    name: string
    environment: XScalarEnvironment
    eventBus: WorkspaceEventBus
    proxyUrl: string
    customFetch?: CustomFetch
  }>()
const loader = useLoadingState()
const { toast } = useToasts()

const updateMetadataUrl = (oauth2MetadataUrl: string): void =>
  eventBus.emit('auth:update:security-scheme', {
    name,
    payload: { type: 'oauth2', oauth2MetadataUrl },
  })

/** Apply metadata only to the scheme and URL that initiated the request. */
const fetchConfiguration = async (): Promise<void> => {
  const url = scheme.oauth2MetadataUrl
  const schemeName = name
  if (!url || loader.isLoading) {
    return
  }
  loader.start()
  const [error, metadata] = await fetchOAuth2Metadata(
    url,
    proxyUrl,
    customFetch,
  )
  await loader.clear()
  // Store updates can replace the proxy without changing the selected authorization server.
  if (name !== schemeName || scheme.oauth2MetadataUrl !== url) {
    return
  }
  if (error) {
    toast(error.message, 'error')
    return
  }
  eventBus.emit('auth:update:security-scheme', {
    name,
    payload: {
      type: 'oauth2',
      flows: oauth2MetadataToFlows(metadata, scheme.flows),
    },
  })
}
</script>

<template>
  <DataTableRow>
    <RequestAuthDataTableInput
      :environment
      :modelValue="scheme.oauth2MetadataUrl ?? ''"
      placeholder="https://example.com/.well-known/oauth-authorization-server"
      @update:modelValue="updateMetadataUrl">
      Metadata URL
    </RequestAuthDataTableInput>
  </DataTableRow>
  <DataTableRow
    v-if="scheme.oauth2MetadataUrl"
    class="min-w-full">
    <div class="flex h-8 w-full items-center justify-end border-t">
      <ScalarButton
        class="mr-0.75 p-0 px-2 py-0.5"
        :loader
        size="sm"
        variant="outlined"
        @click="fetchConfiguration">
        Fetch Configuration
      </ScalarButton>
    </div>
  </DataTableRow>
</template>
