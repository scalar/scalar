<!-- prettier-ignore-attribute generic -->
<script
  setup
  lang="ts"
  generic="O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O>">
import { ScalarIconMagnifyingGlass, ScalarIconPlus } from '@scalar/icons'
import { computed, onMounted, ref, useId, watch } from 'vue'

import { ScalarListboxCheckbox } from '../ScalarListbox'
import ComboboxOption from './ScalarComboboxOption.vue'
import ComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'
import {
  type ComboboxEmits,
  type ComboboxSlots,
  type Option,
  type OptionGroup,
  type OptionsOrGroups,
  isGroups,
} from './types'

const props = defineProps<{
  options: OptionsOrGroups<O, G>
  placeholder?: string
  multiselect?: boolean
}>()

const model = defineModel<O[]>({ default: [] })

const emit = defineEmits<ComboboxEmits>()

const slots = defineSlots<Omit<ComboboxSlots<O, G>, 'default'>>()

defineOptions({ inheritAttrs: false })

/** A unique ID for the combobox */
const id = `scalar-combobox-items-${useId()}`

/** A static option entry for the "Add a new option" option */
const addOption: Option = { id: `${useId()}-add`, label: 'Add a new option' }

/** Generate a unique ID for an option */
function getOptionId(option: Option) {
  return `${id}-${option.id}`
}

/** A flat list of all options */
const options = computed<O[]>(() =>
  isGroups(props.options)
    ? props.options.flatMap((group) => group.options)
    : props.options,
)

/** An list of all groups */
const groups = computed<G[]>(
  () =>
    isGroups(props.options)
      ? props.options // G extends OptionGroup<O>
      : /*
          We know G is an unextended OptionGroup<O> here because of the
          structure of the component props so we can cast it to G
        */
        [{ label: '', options: props.options } as G], // G is OptionGroup<O>
)

const query = ref<string>('')
const active = ref<Option | undefined>(model.value?.[0] ?? options.value[0])

// Clear the query on open and close
onMounted(async () => {
  // Clear the query
  query.value = ''

  // Set the active option to the selected option or the first option
  active.value = model.value?.[0] ?? options.value[0]

  // Scroll to the selected option
  const selected = model.value[0]
  if (selected) {
    setTimeout(() => {
      const value = model.value[0]
      if (!value) {
        return
      }

      document
        ?.getElementById(getOptionId(value))
        ?.scrollIntoView({ block: 'nearest' })
    }, 10)
  }
})

// Set the top option as active when searching
watch(
  () => query.value,
  () => (active.value = withAdd.value[0]),
)

/** The filtered list of options */
const filtered = computed<O[]>(() =>
  query.value === ''
    ? options.value
    : options.value.filter((option) => {
        return option.label.toLowerCase().includes(query.value.toLowerCase())
      }),
)

/** The list of filtered options with the "Add a new option" option */
const withAdd = computed<Option[]>(() =>
  slots.add ? [...filtered.value, addOption] : filtered.value,
)

function toggleSelected(option: Option | undefined) {
  if (!option) {
    return
  }

  if (option.id === addOption.id) {
    addNew()
    return
  }

  if (props.multiselect) {
    // Remove from selection list
    if (model.value.some((o) => o.id === option.id)) {
      model.value = model.value.filter((o) => o.id !== option.id)
    }
    // Add to selection list
    else {
      model.value = [
        ...model.value,
        options.value.find((o) => o.id === option.id)!,
      ]
    }
  } else {
    // Set selection for single select mode
    model.value = [options.value.find((o) => o.id === option.id)!]
  }
}

function moveActive(dir: 1 | -1) {
  const list = withAdd.value

  // Find active index
  const activeIdx = list.findIndex((option) => option.id === active.value?.id)

  // Calculate next index and exit if it's out of bounds
  const nextIdx = activeIdx + dir

  if (nextIdx < 0 || nextIdx > list.length - 1) {
    return
  }

  active.value = list[nextIdx]! // We know it's in bounds from the check above

  if (!active.value) {
    return
  }

  // Scroll to the active option
  document?.getElementById(getOptionId(active.value))?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

function addNew() {
  emit('add')
  query.value = ''
}

// Manual autofocus for the input
const input = ref<HTMLInputElement | null>(null)

// This must be a setTimeout to ensure there is no scroll jump. nextTick does not work here.
onMounted(() => setTimeout(() => input.value?.focus(), 0))
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
    v-show="filtered.length || slots.add"
    :id="id"
    :aria-multiselectable="multiselect"
    class="border-t p-0.75 custom-scroll overscroll-contain flex-1 min-h-0"
    role="listbox"
    tabindex="-1">
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
        <slot
          v-if="$slots.group"
          name="group"
          :group />
        <template v-else>
          {{ group.label }}
        </template>
      </template>
      <template
        v-for="option in filtered"
        :key="option.id">
        <ComboboxOption
          v-if="group.options.some((o) => o.id === option.id)"
          :id="getOptionId(option)"
          :active="active?.id === option.id"
          :selected="model.some((o) => o.id === option.id)"
          @click="toggleSelected(option)"
          @mousedown.prevent
          @mouseenter="active = option"
          v-slot="{ active, selected }">
          <slot
            v-if="$slots.option"
            name="option"
            :option
            :active
            :selected />
          <template v-else>
            <ScalarListboxCheckbox
              :selected="model.some((o) => o.id === option.id)"
              :multiselect />
            <span class="inline-block min-w-0 flex-1 truncate text-c-1">
              {{ option.label }}
            </span>
          </template>
        </ComboboxOption>
      </template>
    </ComboboxOptionGroup>
    <ComboboxOption
      v-if="slots.add"
      :id="getOptionId(addOption)"
      :active="active?.id === addOption.id"
      @click="addNew"
      @mousedown.prevent
      @mouseenter="active = addOption"
      v-slot="{ active }">
      <ScalarIconPlus class="size-4 p-px" />
      <slot
        name="add"
        :active />
    </ComboboxOption>
  </ul>
</template>
