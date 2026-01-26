<script setup lang="ts">
import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getActiveEnvironment } from '@scalar/api-client/v2/helpers'
import { ServerSelector } from '@scalar/api-reference/blocks'
import { type WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import { useState } from '@/state/state'
import Auth from '@/views/Settings/Auth.vue'

const { document, name } = defineProps<{
  document: WorkspaceDocument
  name: string
}>()

const { workspaceStore, config, eventBus } = useState()

const environment = computed(() =>
  getActiveEnvironment(workspaceStore, document),
)

const selectedServer = computed(() => getSelectedServer(document))

const securitySchemes = computed(
  () => document.components?.securitySchemes ?? {},
)
</script>

<template>
  <div class="docSettings">
    <div>
      <ServerSelector
        :eventBus
        :selectedServer
        :servers="document.servers ?? []" />
    </div>
    <div>
      <Auth
        :document
        :environment
        :eventBus
        :name
        :options="config"
        :securitySchemes
        :selectedServer />
    </div>
  </div>
</template>

<style scoped>
.docSettings {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: var(--scalar-font-size-3);
  max-height: 600px;
  overflow-y: scroll;
}

.documentName {
  font-weight: var(--font-weight-bold);
}
</style>
