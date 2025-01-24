<script lang="ts" setup>
import { AddressBarServer } from '@scalar/api-client/components/AddressBar'
import { ServerVariablesForm } from '@scalar/api-client/components/Server'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { useId } from 'vue'

defineProps<{
  layout: 'client' | 'reference'
  target: string
}>()

const { activeServer } = useActiveEntities()
const { serverMutators } = useWorkspace()

const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) return

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
</script>
<template>
  <label class="bg-b-2 flex items-center h-8 px-3 py-2.5 text-sm">Server</label>
  <div class="border-t text-sm">
    <AddressBarServer
      :layout="layout"
      :target="target" />
    <ServerVariablesForm
      :variables="activeServer?.variables"
      @update:variable="updateServerVariable" />
  </div>
</template>
