<script setup lang="ts">
import { ScalarButton, ScalarTeleport } from '@scalar/components'
import { ScalarIconGlobe, ScalarIconPlus } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { onClickOutside } from '@vueuse/core'
import Fuse from 'fuse.js'
import { computed, onMounted, ref, type CSSProperties } from 'vue'
import { useRouter } from 'vue-router'

import { parseEnvVariables } from '@/libs'
import { getEnvColor, type EnvVariables } from '@/libs/env-helpers'
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store'

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
const { activeCollection } = useActiveEntities()

const redirectToEnvironment = () => {
  if (!router) {
    return
  }
  const { currentRoute, push } = router
  const workspaceId = currentRoute.value.params.workspace

  // Global environment page for draft collection
  if (
    !activeCollection.value ||
    activeCollection.value.info?.title === 'Drafts'
  ) {
    push({
      name: 'environment.default',
      params: {
        [PathId.Workspace]: workspaceId,
      },
    })
  } else {
    // Collection environment page for collections
    push({
      name: 'collection.environment',
      params: {
        [PathId.Collection]: activeCollection.value.uid,
      },
    })
  }
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

  if (length === 0) {
    return
  }

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
      class="custom-scroll fixed top-0 left-0 flex max-h-[60svh] w-56 flex-col rounded border p-0.75"
      :style="dropdownStyle">
      <ul
        v-if="filteredVariables.length"
        class="gap-1/2 flex flex-col">
        <template
          v-for="(item, index) in filteredVariables"
          :key="item.key">
          <li
            class="font-code text-xxs hover:bg-b-2 flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            :class="{ 'bg-b-2': index === selectedVariableIndex }"
            @click="selectVariable(item.key)">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <span
                v-if="
                  item.source === 'collection' &&
                  environment.name !== 'No Environment'
                "
                class="h-2.25 w-2.25 min-w-2.25 rounded-full"
                :style="{
                  backgroundColor: getEnvColor(environment),
                }"></span>
              <ScalarIconGlobe
                v-else
                class="-ml-0.25 size-2.5"
                icon="Globe" />
              {{ item.key }}
            </div>
            <span
              class="w-20 overflow-hidden text-right text-ellipsis whitespace-nowrap">
              {{ item.value }}
            </span>
          </li>
        </template>
      </ul>
      <ScalarButton
        v-else-if="router"
        class="font-code text-xxs bg-b-inherit hover:bg-b-2 flex h-8 w-full justify-start gap-2 px-1.5 transition-colors duration-150"
        variant="outlined"
        @click="redirectToEnvironment">
        <ScalarIconPlus class="size-3" />
        Add Variable
      </ScalarButton>
      <!-- Backdrop for the dropdown -->
      <div
        class="bg-b-1 brightness-lifted absolute inset-0 -z-1 rounded shadow-lg" />
    </div>
  </ScalarTeleport>
</template>
