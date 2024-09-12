<script setup lang="ts">
import type { WorkspaceStore } from '@/store/workspace'
import {
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import Fuse from 'fuse.js'
import { computed, ref } from 'vue'
import type { Router } from 'vue-router'

const props = defineProps<{
  query: string
  activeParsedEnvironments: WorkspaceStore['activeParsedEnvironments']
  environments: WorkspaceStore['environments']
  router: Router
  // withServers?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

const isOpen = ref(true)

const redirectToEnvironment = () => {
  const workspaceId = currentRoute.value.params.workspace
  push(`/workspace/${workspaceId}/environment/default`)
  isOpen.value = false
}

const { push, currentRoute } = props.router

const fuse = new Fuse(props.activeParsedEnvironments.value, {
  keys: ['key', 'value'],
})

const filteredVariables = computed(() => {
  const searchQuery = props.query

  if (!searchQuery) {
    /** return the last 4 environment variables on first display */
    return props.activeParsedEnvironments.value.slice(-4)
  }

  /** filter environment variables by name */
  const result = fuse.search(searchQuery)
  if (result.length > 0) {
    return result.map((res) => res.item)
  }

  return []
})

const selectVariable = (variableKey: string) => {
  emit('select', variableKey)
}

const getEnvColor = (
  item:
    | {
        key: string
        value: string
      }
    | {
        _scalarEnvId: any
        key: string
        value: unknown
      },
) => {
  if ('_scalarEnvId' in item) {
    return props.environments[item._scalarEnvId as string].color
  }
  // this is a server but we can eventually is a 🌐 icon
  return '#8E8E8E'
}
</script>
<template>
  <ScalarDropdown
    id="env-dialog"
    class="z-10 w-60 rounded border bg-b-1 p-1"
    :open="isOpen"
    static>
    <template #items>
      <ul v-if="filteredVariables.length">
        <template
          v-for="item in filteredVariables"
          :key="item.key">
          <li
            class="h-8 font-code text-3xs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            @click="selectVariable(item.key)">
            <!-- @click.stop="selectVariable(variable)" -->
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              <span
                class="h-2.5 w-2.5 min-w-2.5 rounded-full"
                :class="getEnvColor(item)"></span>
              {{ item.key }}
            </div>
            <span class="w-20 overflow-hidden text-ellipsis text-right">
              {{ item.value }}
            </span>
          </li>
        </template>
      </ul>
      <ScalarDropdownItem
        v-else
        class="font-code !text-3xs hover:bg-b-2 flex h-8 w-full justify-start gap-2 !px-1.5 transition-colors duration-150"
        @click="redirectToEnvironment">
        <ScalarIcon
          class="w-2"
          icon="Add"
          size="xs" />
        Add variable
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
