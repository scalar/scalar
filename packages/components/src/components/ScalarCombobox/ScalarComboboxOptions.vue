<script setup lang="ts">
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue'

import ComboboxOption from './ScalarComboboxOption.vue'
import ComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'
import {
  type ComboboxSlots,
  type Option,
  type OptionGroup,
  isGroups,
} from './types'

const props = defineProps<{
  options: Option[] | OptionGroup[]
  modelValue?: Option[]
  placeholder?: string
  multiselect?: boolean
  isDeletable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: Option[]): void
  (e: 'delete', option: Option): void
}>()

defineSlots<Omit<ComboboxSlots, 'default'>>()

defineOptions({ inheritAttrs: false })

/** A unique ID for the combobox */
const id = `scalar-combobox-items-${useId()}`

/** Generate a unique ID for an option */
function getOptionId(option: Option) {
  return `${id}-${option.id}`
}

/** A flat list of all options */
const options = computed<Option[]>(() =>
  isGroups(props.options)
    ? props.options.flatMap((group) => group.options)
    : props.options,
)

/** An list of all groups */
const groups = computed<OptionGroup[]>(() =>
  isGroups(props.options)
    ? props.options
    : [{ label: '', options: props.options }],
)

const query = ref<string>('')
const active = ref<Option | undefined>(
  props.modelValue?.[0] ?? options.value[0],
)

// Clear the query on open and close
onMounted(async () => {
  // Clear the query
  query.value = ''

  // Set the active option to the selected option or the first option
  active.value = props.modelValue?.[0] ?? options.value[0]

  // Scroll to the selected option
  if (selected.value.length !== 0) {
    setTimeout(() => {
      document
        ?.getElementById(getOptionId(selected.value[0]))
        ?.scrollIntoView({ block: 'nearest' })
    }, 10)
  }
})

// Set the top option as active when searching
watch(
  () => query.value,
  () => (active.value = filtered.value[0]),
)

const filtered = computed<Option[]>(() =>
  query.value === ''
    ? options.value
    : options.value.filter((option) => {
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
    if (selected.value.some((o) => o.id === option.id)) {
      selected.value = selected.value.filter((o) => o.id !== option.id)
    }
    // Add to selection list
    else {
      selected.value = [...selected.value, option]
    }
  } else {
    // Set selection for single select mode
    selected.value = [option]
  }
}

function moveActive(dir: 1 | -1) {
  const list = filtered.value

  // Find active index
  const activeIdx = list.findIndex((option) => option.id === active.value?.id)

  // Calculate next index and exit if it's out of bounds
  const nextIdx = activeIdx + dir
  if (nextIdx < 0 || nextIdx > list.length - 1) {
    return
  }

  active.value = list[nextIdx]

  // Scroll to the active option
  document?.getElementById(getOptionId(active.value))?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

// Manual autofocus for the input
const input = ref<HTMLInputElement | null>(null)
nextTick(() => input.value?.focus())
</script>
<template>
  <div class="relative flex">
    <ScalarIconMagnifyingGlass
      class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-c-3 size-4" />
    <input
      v-model="query"
      ref="input"
      :aria-activedescendant="active ? getOptionId(active) : undefined"
      aria-autocomplete="list"
      :aria-controls="id"
      class="min-w-0 flex-1 rounded border-0 py-2.5 pl-8 pr-3 leading-none text-c-1 -outline-offset-1"
      data-1p-ignore
      :placeholder="placeholder"
      role="combobox"
      tabindex="0"
      type="text"
      @keydown.down.prevent="moveActive(1)"
      @keydown.enter.prevent="active && toggleSelected(active)"
      @keydown.up.prevent="moveActive(-1)" />
  </div>
  <ul
    v-show="filtered.length || $slots.before || $slots.after"
    :id="id"
    :aria-multiselectable="multiselect"
    class="border-t p-0.75 custom-scroll overscroll-contain flex-1 min-h-0"
    role="listbox"
    tabindex="-1">
    <slot name="before" />
    <ComboboxOptionGroup
      v-for="(group, i) in groups"
      :id="`${id}-group-${i}`"
      :key="i"
      :hidden="
        // Only show the group label if there are some results
        !group.options.some((o) => filtered.some((f) => f.id === o.id)) ||
        // And it has a label
        !group.label
      ">
      <template #label>
        {{ group.label }}
      </template>
      <template
        v-for="option in filtered"
        :key="option.id">
        <ComboboxOption
          v-if="group.options.some((o) => o.id === option.id)"
          :id="getOptionId(option)"
          :active="active?.id === option.id"
          :isDeletable="option.isDeletable ?? isDeletable"
          :selected="selected.some((o) => o.id === option.id)"
          :style="multiselect ? 'checkbox' : 'radio'"
          @click="toggleSelected(option)"
          @delete="$emit('delete', option)"
          @mousedown.prevent
          @mouseenter="active = option">
          {{ option.label }}
        </ComboboxOption>
      </template>
    </ComboboxOptionGroup>
    <slot name="after" />
  </ul>
</template>
