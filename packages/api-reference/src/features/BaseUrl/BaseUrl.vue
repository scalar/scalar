<script lang="ts" setup>
import {
  ServerDropdown,
  ServerVariablesForm,
} from '@scalar/api-client/components/Server'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { ScalarMarkdown } from '@scalar/components'
import { useId } from 'vue'

const { activeCollection, activeServer } = useActiveEntities()
const { serverMutators } = useWorkspace()

const id = useId()
const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) return

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
</script>
<template>
  <label class="bg-b-2 flex h-8 items-center px-3 py-2.5 text-sm font-medium">
    Server
  </label>
  <div :id="id">
    <ServerDropdown
      v-if="activeCollection?.servers?.length"
      :collection="activeCollection"
      layout="reference"
      :server="activeServer"
      :target="id" />
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
