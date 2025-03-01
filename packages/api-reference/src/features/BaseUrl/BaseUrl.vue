<script lang="ts" setup>
import {
  ServerSelector,
  ServerVariablesForm,
} from '@scalar/api-client/components/Server'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { ScalarMarkdown } from '@scalar/components'
import { useId } from 'vue'

import { useConfig } from '@/hooks/useConfig'

const { activeCollection, activeServer } = useActiveEntities()
const { serverMutators } = useWorkspace()

const id = useId()
const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) return

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
const { onServerChange } = useConfig()

const updateServer = (server: string) => {
  onServerChange?.(server)
}
</script>
<template>
  <label class="bg-b-2 flex h-8 items-center px-3 py-2.5 text-sm font-medium">
    Server
  </label>
  <div :id="id">
    <ServerSelector
      v-if="activeCollection?.servers?.length"
      :collection="activeCollection"
      :server="activeServer"
      :target="id"
      @updateServer="updateServer" />
  </div>
  <ServerVariablesForm
    :variables="activeServer?.variables"
    @update:variable="updateServerVariable" />
  <!-- Description -->
  <ScalarMarkdown
    v-if="activeServer?.description"
    class="text-c-3 px-3 py-1.5"
    :value="activeServer.description" />
</template>
