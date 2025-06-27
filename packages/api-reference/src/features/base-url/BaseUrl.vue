<script lang="ts" setup>
import {
  ServerSelector,
  ServerVariablesForm,
} from '@scalar/api-client/components/Server'
import { useWorkspace } from '@scalar/api-client/store'
import { ScalarMarkdown } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import { useId } from 'vue'

import { useConfig } from '@/hooks/useConfig'

const { collection, server } = defineProps<{
  collection: Collection
  server?: Server
}>()

const { serverMutators } = useWorkspace()

const id = useId()
const config = useConfig()

const updateServerVariable = (key: string, value: string) => {
  if (!server) {
    return
  }

  const variables = server.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(server.uid, 'variables', variables)
}

const updateServer = (newServer: string) => {
  config.value.onServerChange?.(newServer)
}
</script>
<template>
  <label
    class="bg-b-2 flex h-8 items-center rounded-t-lg border border-b-0 px-3 py-2.5 text-base font-medium">
    Server
  </label>
  <div
    :id="id"
    class="border"
    :class="{
      'rounded-b-lg': !server?.description,
    }">
    <ServerSelector
      v-if="collection?.servers?.length"
      :collection="collection"
      :server="server"
      :target="id"
      @updateServer="updateServer" />
  </div>
  <ServerVariablesForm
    :variables="server?.variables"
    layout="reference"
    @update:variable="updateServerVariable" />
  <!-- Description -->
  <ScalarMarkdown
    v-if="server?.description"
    class="text-c-3 rounded-b-lg border border-t-0 px-3 py-1.5"
    :value="server.description" />
</template>
