<script setup lang="ts">
import { nanoid } from 'nanoid'
import { computed, ref, watch } from 'vue'

import { ScalarIcon } from '../ScalarIcon'
import ComboboxOption from './ScalarComboboxOption.vue'
import type { Option } from './types'

const props = defineProps<{
  options: Option[]
  modelValue?: Option[]
  placeholder?: string
  open?: boolean
  multiselect?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
}>()

defineOptions({ inheritAttrs: false })

const id = nanoid()

const query = ref<string>('')
const active = ref<Option>(props.modelValue?.[0] ?? props.options[0])

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

const selected = computed<Option[]>({
  get: () => props.modelValue ?? [],
  set: (o: Option[]) => o && emit('update:modelValue', o),
})

function toggleSelected(option: Option) {
  if (props.multiselect) {
    // Remove from selection list
    if (selected.value.some((o) => o.id === option.id))
      selected.value = selected.value.filter((o) => o.id !== option.id)
    // Add to selection list
    else selected.value = [...selected.value, option]
  } else {
    // Set selection for single select mode
    selected.value = [option]
  }
}

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
  <div class="relative flex">
    <ScalarIcon
      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-c-3"
      icon="Search"
      size="sm" />
    <input
      v-model="query"
      aria-autocomplete="list"
      :aria-controls="id"
      class="min-w-0 flex-1 rounded-none border-0 py-2.5 pl-8 pr-3 leading-none text-c-1 outline-none"
      :placeholder="placeholder"
      role="combobox"
      tabindex="0"
      type="text"
      @keydown.down.prevent="moveActive(1)"
      @keydown.enter.prevent="toggleSelected(active)"
      @keydown.up.prevent="moveActive(-1)" />
  </div>
  <ul
    v-show="filtered.length"
    :id="id"
    class="border-t p-0.75">
    <ComboboxOption
      v-for="option in filtered"
      :key="option.id"
      :active="active?.id === option.id"
      :selected="selected.some((o) => o.id === option.id)"
      @click="toggleSelected(option)"
      @mouseenter="active = option">
      {{ option.label }}
    </ComboboxOption>
  </ul>
</template>
