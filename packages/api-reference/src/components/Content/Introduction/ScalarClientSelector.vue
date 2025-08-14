<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import { ClientLibraries } from '../ClientLibraries'

const { config, store } = defineProps<{
  config?: ApiReferenceConfiguration
  clientOptions: ClientOptionGroup[]
  store: WorkspaceStore
}>()
</script>
<template>
  <ClientLibraries
    v-if="
      config?.hiddenClients !== true &&
      clientOptions.length &&
      store.workspace.activeDocument
    "
    :clientOptions
    :document="store.workspace.activeDocument"
    :selectedClient="store.workspace['x-scalar-default-client']"
    class="introduction-card-item scalar-reference-intro-clients" />
</template>
