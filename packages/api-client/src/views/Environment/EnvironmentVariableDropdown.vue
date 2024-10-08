<script setup lang="ts">
import { parseEnvVariables } from '@/libs'
import type { WorkspaceStore } from '@/store'
import { ScalarButton, ScalarDropdown, ScalarIcon } from '@scalar/components'
import { onClickOutside } from '@vueuse/core'
import Fuse from 'fuse.js'
import { computed, ref } from 'vue'
import type { Router } from 'vue-router'

const props = defineProps<{
  query: string
  activeEnvVariables: WorkspaceStore['activeEnvVariables']
  router: Router
  // withServers?: boolean
  dropdownPosition?: { left: number; top: number }
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

const isOpen = ref(true)
const dropdownRef = ref<HTMLElement | null>(null)

const redirectToEnvironment = () => {
  const workspaceId = currentRoute.value.params.workspace
  push(`/workspace/${workspaceId}/environment/default`)
  isOpen.value = false
}

const { push, currentRoute } = props.router

const fuse = new Fuse(parseEnvVariables(props.activeEnvVariables.value), {
  keys: ['key', 'value'],
})

const filteredVariables = computed(() => {
  const searchQuery = props.query

  if (!searchQuery) {
    /** return the last 4 environment variables on first display */
    return parseEnvVariables(props.activeEnvVariables.value).slice(-4)
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

const getEnvColor = () => {
  return props.activeEnvVariables.value.map((variable) => {
    if (variable.key === 'color') {
      return `bg-${variable.value}`
    }
  })
}

onClickOutside(
  dropdownRef,
  () => {
    isOpen.value = false
  },
  { ignore: [dropdownRef] },
)
</script>
<template>
  <ScalarDropdown
    ref="dropdownRef"
    class="mt-2 min-w-60 rounded border bg-b-1 p-1 w-fit"
    static
    :staticOpen="isOpen"
    :style="{
      left: dropdownPosition?.left + 'px',
      top: dropdownPosition?.top + 'px',
    }"
    teleport=".scalar-client">
    <template #items>
      <ul v-if="filteredVariables.length">
        <template
          v-for="item in filteredVariables"
          :key="item.key">
          <li
            class="h-8 font-code text-xxs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            @click="selectVariable(item.key)">
            <!-- @click.stop="selectVariable(variable)" -->
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              <span
                class="h-2.5 w-2.5 min-w-2.5 rounded-full"
                :class="getEnvColor()"></span>
              {{ item.key }}
            </div>
            <span
              class="w-20 overflow-hidden text-ellipsis text-right whitespace-nowrap">
              {{ item.value }}
            </span>
          </li>
        </template>
      </ul>
      <ScalarButton
        v-else
        class="font-code text-xxs hover:bg-b-2 flex h-8 w-full justify-start gap-2 px-1.5 transition-colors duration-150"
        variant="secondary"
        @click="redirectToEnvironment">
        <ScalarIcon
          class="w-2.5"
          icon="Add" />
        Add Variable
      </ScalarButton>
    </template>
  </ScalarDropdown>
</template>
