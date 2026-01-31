<script setup lang="ts">
import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getActiveEnvironment, getServers } from '@scalar/api-client/v2/helpers'
import { type WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed } from 'vue'

import ServerSelector from '@/components/ServerSelector.vue'
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

const selectedServer = computed(() => {
  const servers = getServers(document.servers, {
    documentUrl: document['x-scalar-original-source-url'],
  })

  return getSelectedServer(document, servers)
})

const securitySchemes = computed(
  () => document.components?.securitySchemes ?? {},
)
</script>

<template>
  <div class="docSettings">
    <div>
      <Auth
        :authStore="workspaceStore.auth"
        :document
        :environment
        :eventBus
        :name
        :options="config"
        :securitySchemes
        :selectedServer />
    </div>
    <div>
      <ServerSelector
        :eventBus
        :selectedServer
        :servers="document.servers ?? []" />
    </div>
  </div>
</template>

<style scoped>
.docSettings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
  font-size: var(--scalar-font-size-3);
  max-height: 600px;
}

.documentName {
  font-weight: var(--scalar-semibold);
}
</style>
