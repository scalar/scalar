<script setup lang="ts">
import { nanoid } from 'nanoid'
import { computed, ref, watch } from 'vue'

import { ScalarIcon } from '../ScalarIcon'
import ComboboxOption from './ScalarComboboxOption.vue'
import type { Option } from './types'

type MaybeOption = Option | undefined

const props = defineProps<{
  options: Option[]
  modelValue?: Option
  placeholder?: string
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Option): void
}>()

defineOptions({ inheritAttrs: false })

const id = nanoid()

const query = ref<string>('')
const active = ref<Option>(props.modelValue ?? props.options[0])

// Clear the query on open and close
watch(
  () => props.open,
  () => (query.value = ''),
)

// Set the top option as active when searching
watch(
  () => query.value,
  () => (active.value = filtered.value[0]),
)

const filtered = computed<Option[]>(() =>
  query.value === ''
    ? props.options
    : props.options.filter((option) => {
        return option.label.toLowerCase().includes(query.value.toLowerCase())
      }),
)

const selected = computed<MaybeOption>({
  get: () => props.modelValue,
  set: (o) => o && emit('update:modelValue', o),
})

function moveActive(dir: 1 | -1) {
  const list = filtered.value

  // Find active index
  const activeIdx = list.findIndex((option) => option.id === active.value.id)

  // Calculate next index and exit if it's out of bounds
  const nextIdx = activeIdx + dir
  if (nextIdx < 0 || nextIdx > list.length - 1) return

  active.value = list[nextIdx]
}
</script>
<template>
  <div class="flex items-center gap-2 px-3 py-2.5">
    <ScalarIcon
      class="text-c-3"
      icon="Search"
      size="sm" />
    <input
      v-model="query"
      aria-autocomplete="list"
      :aria-controls="id"
      class="h-3.5 min-w-0 flex-1 rounded-none border-0 p-0 text-c-1 outline-none"
      :placeholder="placeholder"
      role="combobox"
      tabindex="0"
      type="text"
      @keydown.down="moveActive(1)"
      @keydown.enter.prevent="selected = active"
      @keydown.up="moveActive(-1)" />
  </div>
  <ul
    v-show="filtered.length"
    :id="id"
    class="border-t p-0.75"
    static>
    <ComboboxOption
      v-for="option in filtered"
      :key="option.id"
      :active="active?.id === option.id"
      :selected="selected?.id === option.id"
      @click="selected = option"
      @mouseenter="active = option">
      {{ option.label }}
    </ComboboxOption>
  </ul>
</template>
