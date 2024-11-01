<script setup lang="ts">
import { parseEnvVariables } from '@/libs'
import type { WorkspaceStore } from '@/store'
import { ScalarButton, ScalarDropdown, ScalarIcon } from '@scalar/components'
import { onClickOutside } from '@vueuse/core'
import Fuse from 'fuse.js'
import { computed, onMounted, ref } from 'vue'
import type { Router } from 'vue-router'

const props = defineProps<{
  query: string
  activeEnvironment: WorkspaceStore['activeEnvironment']
  activeEnvVariables: WorkspaceStore['activeEnvVariables']
  router: Router
  // withServers?: boolean
  dropdownPosition?: { left: number; top: number }
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

type ActiveEnvironment = WorkspaceStore['activeEnvironment']
const isOpen = ref(true)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedVariableIndex = ref(0)

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
    return parseEnvVariables(props.activeEnvVariables.value)
      .slice(-4)
      .filter(({ key, value }) => key !== '' || value !== '')
  }

  /** filter environment variables by name */
  const result = fuse.search(searchQuery)
  if (result.length > 0) {
    return result
      .map((res) => res.item)
      .filter(({ key, value }) => key !== '' || value !== '')
  }

  return []
})

const selectVariable = (variableKey: string) => {
  emit('select', variableKey)
}

const getEnvColor = (activeEnvironment: ActiveEnvironment) => {
  if (activeEnvironment.value) {
    return activeEnvironment.value.color
  }

  return '#8E8E8E'
}

const handleArrowKey = (direction: 'up' | 'down') => {
  const offset = direction === 'up' ? -1 : 1
  const length = filteredVariables.value.length

  if (length === 0) return

  selectedVariableIndex.value =
    (selectedVariableIndex.value + offset + length) % length
}

const handleSelect = () => {
  if (selectedVariableIndex.value >= 0) {
    const selectedVariable =
      filteredVariables.value[selectedVariableIndex.value]
    if (selectedVariable) {
      selectVariable(selectedVariable.key)
    }
  }
}

defineExpose({
  handleArrowKey,
  handleSelect,
})

onMounted(() => {
  // Reset selected index to the first item when dropdown opens
  selectedVariableIndex.value = 0
})

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
          v-for="(item, index) in filteredVariables"
          :key="item.key">
          <li
            class="h-8 font-code text-xxs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            :class="{ 'bg-b-2': index === selectedVariableIndex }"
            @click="selectVariable(item.key)">
            <!-- @click.stop="selectVariable(variable)" -->
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              <span
                class="h-2.5 w-2.5 min-w-2.5 rounded-full"
                :style="{
                  backgroundColor: getEnvColor(activeEnvironment),
                }"></span>
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
