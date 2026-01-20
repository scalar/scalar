<script setup lang="ts">
import { ScalarButton, ScalarIcon, useLoadingState } from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import { DataTableRow } from '@/components/DataTable'
import {
  fetchOpenIDConnectDiscovery,
  type OpenIDConnectDiscovery as OpenIDConnectDiscoveryType,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/openid-connect'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { environment } = defineProps<{
  environment: any
}>()

const emits = defineEmits<{
  (e: 'discovered', payload: OpenIDConnectDiscoveryType): void
}>()

const discoveryUrl = ref('')
const loader = useLoadingState()
const { toast } = useToasts()

/**
 * Fetches the OpenID Connect discovery document and emits the result.
 * This will pre-fill the OAuth2 form fields with the discovered values.
 */
const handleFetchDiscovery = async (): Promise<void> => {
  if (loader.isLoading || !discoveryUrl.value) {
    return
  }

  loader.start()

  const [error, discovery] = await fetchOpenIDConnectDiscovery(
    discoveryUrl.value,
  )

  await loader.clear()

  if (discovery) {
    emits('discovered', discovery)
    toast('OpenID Connect configuration loaded successfully', 'success')
  } else {
    console.error(error)
    toast(
      error?.message ?? 'Failed to fetch OpenID Connect configuration',
      'error',
    )
  }
}
</script>

<template>
  <DataTableRow>
    <RequestAuthDataTableInput
      v-model="discoveryUrl"
      class="border-r-transparent"
      :environment
      placeholder="https://accounts.example.com or https://accounts.example.com/.well-known/openid-configuration"
      @keydown.enter="handleFetchDiscovery">
      <div class="flex items-center gap-1.5">
        <ScalarIcon
          icon="Lock"
          size="sm" />
        <span>OpenID Connect URL</span>
      </div>
    </RequestAuthDataTableInput>
  </DataTableRow>

  <DataTableRow class="min-w-full">
    <div class="flex h-8 items-center justify-end gap-2 border-t">
      <ScalarButton
        class="mr-1 p-0 px-2 py-0.5"
        :disabled="!discoveryUrl"
        :loader
        size="sm"
        variant="outlined"
        @click="handleFetchDiscovery">
        Fetch Configuration
      </ScalarButton>
    </div>
  </DataTableRow>
</template>
