<script setup lang="ts">
import { ScalarButton, ScalarTeleport } from '@scalar/components'
import { ScalarIconPlus } from '@scalar/icons'
import { POPULAR_CONTEXT_FUNCTION_KEYS } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { onClickOutside } from '@vueuse/core'
import Fuse from 'fuse.js'
import { computed, onMounted, ref, type CSSProperties } from 'vue'

type DropdownRow =
  | { kind: 'env'; key: string; secondary: string }
  | { kind: 'context'; key: string; secondary: string }

const {
  query,
  environment,
  dropdownPosition,
  contextFunctionItems = [],
} = defineProps<{
  query: string
  environment?: XScalarEnvironment
  dropdownPosition?: { left: number; top: number }
  /** Runtime placeholders such as `{{$guid}}`, shown with environment variables */
  contextFunctionItems?: { key: string; description: string }[]
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
  (e: 'redirect'): void
}>()

const isOpen = ref(true)
const dropdownRef = ref<HTMLElement | null>(null)
const selectedVariableIndex = ref(0)

const redirectToEnvironment = () => {
  emit('redirect')
  isOpen.value = false
}

/** Normalize the variables to have a name and value */
const normalizedVariables = computed(() =>
  (environment?.variables ?? []).map((v) => ({
    key: v.name,
    value: typeof v.value === 'string' ? v.value : v.value.default,
  })),
)

const contextRows = computed((): DropdownRow[] =>
  contextFunctionItems.map((item) => ({
    kind: 'context',
    key: item.key,
    secondary: item.description,
  })),
)

const envRows = computed((): DropdownRow[] =>
  normalizedVariables.value
    .filter(({ key, value }) => key !== '' || value !== '')
    .map(({ key, value }) => ({
      kind: 'env' as const,
      key,
      secondary: value,
    })),
)

type FuseRow = DropdownRow & { fuseText: string }

const envFuseSource = computed((): FuseRow[] =>
  envRows.value.map((row) => ({
    ...row,
    fuseText: `${row.key} ${row.secondary}`,
  })),
)

const contextFuseSource = computed((): FuseRow[] =>
  contextRows.value.map((row) => ({
    ...row,
    fuseText: `${row.key} ${row.secondary}`,
  })),
)

const fuseEnv = computed(
  () =>
    new Fuse(envFuseSource.value, {
      keys: ['fuseText'],
      threshold: 0.35,
    }),
)

const fuseContext = computed(
  () =>
    new Fuse(contextFuseSource.value, {
      keys: ['fuseText'],
      threshold: 0.35,
    }),
)

const popularContextRows = computed((): DropdownRow[] => {
  const byKey = new Map(contextFunctionItems.map((c) => [c.key, c]))
  return POPULAR_CONTEXT_FUNCTION_KEYS.flatMap((key) => {
    const item = byKey.get(key)
    return item
      ? [
          {
            kind: 'context' as const,
            key: item.key,
            secondary: item.description,
          },
        ]
      : []
  })
})

const DROPDOWN_LIMIT = 12

const filteredVariables = computed((): DropdownRow[] => {
  if (!query.trim()) {
    const envSlice = envRows.value.slice(-4)
    return [...envSlice, ...popularContextRows.value]
  }

  const q = query.trim()
  const envMatches = fuseEnv.value
    .search(q, { limit: DROPDOWN_LIMIT })
    .map((res) => {
      const { kind, key, secondary } = res.item
      return { kind, key, secondary }
    })

  const remaining = DROPDOWN_LIMIT - envMatches.length
  const contextMatches =
    remaining > 0
      ? fuseContext.value.search(q, { limit: remaining }).map((res) => {
          const { kind, key, secondary } = res.item
          return { kind, key, secondary }
        })
      : []

  return [...envMatches, ...contextMatches]
})

const selectVariable = (variableKey: string): void => {
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
    left: (dropdownPosition?.left ?? 0) + 'px',
    // Add a 5px offset from the editor
    top: (dropdownPosition?.top ?? 0) + 5 + 'px',
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
      class="custom-scroll z-context fixed top-0 left-0 flex max-h-[60svh] w-56 flex-col rounded border p-0.75"
      :style="dropdownStyle">
      <ul
        v-if="filteredVariables.length"
        class="gap-1/2 flex flex-col">
        <template
          v-for="(item, index) in filteredVariables"
          :key="`${item.kind}-${item.key}`">
          <li
            class="font-code text-xxs hover:bg-b-2 flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
            :class="{ 'bg-b-2': index === selectedVariableIndex }"
            @click="selectVariable(item.key)">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <span
                v-if="item.kind === 'env'"
                class="h-2.25 w-2.25 min-w-2.25 rounded-full"
                :style="{
                  backgroundColor: environment?.color,
                }" />
              <span
                v-else
                class="text-c-3 bg-b-3 flex h-4.5 min-w-4.5 items-center justify-center rounded px-0.5 font-sans text-[9px] font-semibold">
                fn
              </span>
              {{ item.key }}
            </div>
            <span
              class="max-w-[9rem] overflow-hidden text-right text-ellipsis whitespace-nowrap">
              {{ item.secondary }}
            </span>
          </li>
        </template>
      </ul>
      <ScalarButton
        v-else
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
