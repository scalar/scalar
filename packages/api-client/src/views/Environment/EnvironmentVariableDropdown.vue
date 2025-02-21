<script setup lang="ts">
import { parseEnvVariables } from '@/libs'
import { type EnvVariables, getEnvColor } from '@/libs/env-helpers'
import { ScalarButton, ScalarIcon, ScalarTeleport } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { onClickOutside } from '@vueuse/core'
import Fuse from 'fuse.js'
import { type CSSProperties, computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  query: string
  environment: Environment
  envVariables: EnvVariables
  // withServers?: boolean
  dropdownPosition?: { left: number; top: number }
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

const isOpen = ref(true)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedVariableIndex = ref(0)
const router = useRouter()

const redirectToEnvironment = () => {
  if (!router) return
  const { currentRoute, push } = router

  const workspaceId = currentRoute.value.params.workspace
  push({
    name: 'environment.default',
    params: {
      workspace: workspaceId,
    },
  })
  isOpen.value = false
}

const fuse = new Fuse(parseEnvVariables(props.envVariables), {
  keys: ['key', 'value'],
})

const filteredVariables = computed(() => {
  const searchQuery = props.query

  if (!searchQuery) {
    /** return the last 4 environment variables on first display */
    return parseEnvVariables(props.envVariables)
      .slice(-4)
      .filter(({ key, value }) => key !== '' || value !== '')
  }

  /** filter environment variables by name */
  const result = fuse.search(searchQuery, { limit: 10 })
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

const dropdownStyle = computed<CSSProperties>(() => {
  return {
    left: (props.dropdownPosition?.left ?? 0) + 'px',
    // Add a 5px offset from the editor
    top: (props.dropdownPosition?.top ?? 0) + 5 + 'px',
  }
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
  <ScalarTeleport
    v-if="isOpen"
    class="scalar-client">
    <div
      ref="dropdownRef"
      class="fixed left-0 top-0 flex flex-col p-0.75 max-h-[60svh] w-56 rounded border custom-scroll"
      :style="dropdownStyle">
      <ul
        v-if="filteredVariables.length"
        class="flex flex-col gap-1/2">
        <template
          v-for="(item, index) in filteredVariables"
          :key="item.key">
          <li
            class="h-8 font-code text-xxs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            :class="{ 'bg-b-2': index === selectedVariableIndex }"
            @click="selectVariable(item.key)">
            <div class="flex items-center gap-1.5 whitespace-nowrap">
              <span
                v-if="item.source === 'collection'"
                class="h-2.5 w-2.5 min-w-2.5 rounded-full"
                :style="{
                  backgroundColor: getEnvColor(environment),
                }"></span>
              <ScalarIcon
                v-else
                class="w-2.5"
                icon="Globe" />
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
        v-else-if="router"
        class="font-code text-xxs hover:bg-b-2 flex h-8 w-full justify-start gap-2 px-1.5 transition-colors duration-150"
        variant="secondary"
        @click="redirectToEnvironment">
        <ScalarIcon
          icon="Add"
          size="sm" />
        Add Variable
      </ScalarButton>
      <!-- Backdrop for the dropdown -->
      <div
        class="absolute inset-0 -z-1 rounded bg-b-1 shadow-lg brightness-lifted" />
    </div>
  </ScalarTeleport>
</template>
