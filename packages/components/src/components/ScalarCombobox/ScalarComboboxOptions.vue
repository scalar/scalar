<script lang="ts">
/**
 * Scalar Combobox Options component
 *
 * Renders the searchable option list for a combobox, including
 * filtering, keyboard navigation, and an optional "add new" action.
 *
 * @example
 * <ScalarComboboxOptions v-model="selected" :options="options" />
 */
export default {}
</script>

<!-- prettier-ignore-attribute generic -->
<script
  setup
  lang="ts"
  generic="O extends Option = Option, G extends OptionGroup<O> = OptionGroup<O>">
import { filterByOptionLabel } from '@/components/ScalarCombobox/filter-by-option-label'
import { ScalarIconMagnifyingGlass, ScalarIconPlus } from '@scalar/icons'
import { computed, onMounted, ref, useId, watch } from 'vue'

import { ScalarListboxCheckbox } from '../ScalarListbox'
import { type LoadingState, ScalarLoading } from '../ScalarLoading'
import ComboboxOption from './ScalarComboboxOption.vue'
import ComboboxOptionGroup from './ScalarComboboxOptionGroup.vue'
import {
  type ComboboxEmits,
  type ComboboxSlots,
  type FilterFunction,
  type Option,
  type OptionGroup,
  type OptionsOrGroups,
  isGroups,
} from './types'

const {
  options: optionsOrGroups,
  placeholder,
  inputLabel,
  noResults,
  close,
  filterFn = filterByOptionLabel,
  loader,
  multiselect,
} = defineProps<{
  /** The options to display in the combobox */
  options: OptionsOrGroups<O, G>
  /** The placeholder text to display in the combobox */
  placeholder?: string
  /** An accessible label for the search input */
  inputLabel?: string
  /** The message to display when filtering returns no options */
  noResults?: string
  /** Close the popover without changing the current selection */
  close?: () => void
  /**
   * A function to filter the options based on a query,
   * if not provided, the options will be filtered by option label
   *
   * Pass `(_, options) => options` when the caller searches the options itself (e.g. on a
   * server) using the `query` model, so results the server already matched are shown as given.
   *
   * @see {@link FilterFunction} for more information
   */
  filterFn?: FilterFunction<O, G>
  /**
   * The loading state of the options, see `useLoadingState`
   *
   * Shows a spinner at the end of the search input while active, or an X when the state is
   * invalidated (e.g. a failed request). While loading with no options yet, the list shows
   * placeholder rows instead of the "no results" message.
   */
  loader?: LoadingState
  /** Whether the combobox is in multiselect mode, defaults to false */
  multiselect?: boolean
}>()

const emit = defineEmits<ComboboxEmits>()

const model = defineModel<O[]>({ default: () => [] })

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
  isGroups(optionsOrGroups)
    ? optionsOrGroups.flatMap((group) => group.options)
    : optionsOrGroups,
)

/** An list of all groups */
const groups = computed<G[]>(
  () =>
    isGroups(optionsOrGroups)
      ? optionsOrGroups // G extends OptionGroup<O>
      : /*
          We know G is an unextended OptionGroup<O> here because of the
          structure of the component props so we can cast it to G
        */
        [{ label: '', options: optionsOrGroups } as G], // G is OptionGroup<O>
)

/** The search query, exposed so callers can search the options themselves */
const query = defineModel<string>('query', { default: '' })
const activeRef = ref<Option | undefined>(model.value?.[0] ?? options.value[0])

// Clear the query on open and close
onMounted(() => {
  // Clear the query
  query.value = ''

  // Set the active option to the selected option or the first option
  activeRef.value = model.value?.[0] ?? options.value[0]

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
  () => (activeRef.value = withAdd.value[0]),
)

/** The filtered list of options */
const filtered = computed<O[]>(() =>
  filterFn(query.value, options.value, groups.value),
)

/** The list of filtered options with the "Add a new option" option */
const withAdd = computed<Option[]>(() =>
  slots.add ? [...filtered.value, addOption] : filtered.value,
)

/**
 * Async options arrive after the query has changed, so the active option can point at
 * a row that no longer exists. Move it back to the top when that happens.
 */
watch(withAdd, (list) => {
  if (!list.some((option) => option.id === activeRef.value?.id)) {
    activeRef.value = list[0]
  }
})

/** Whether the options are still loading */
const isLoading = computed<boolean>(() => Boolean(loader?.isLoading))

/** Show placeholder rows while the first batch of options loads */
const showSkeleton = computed<boolean>(
  () => isLoading.value && !filtered.value.length,
)

/** Whether there is anything to show at the end of the search input */
const showSearchEnd = computed<boolean>(() =>
  Boolean(slots['search-end'] || loader?.isActive),
)

/** Whether the listbox has anything to show */
const showList = computed<boolean>(() =>
  Boolean(
    filtered.value.length ||
    slots.add ||
    showSkeleton.value ||
    (noResults && !isLoading.value),
  ),
)

function toggleSelected(option: Option | undefined) {
  if (!option) {
    return
  }

  if (option.id === addOption.id) {
    addNew()
    return
  }

  if (multiselect) {
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
  const activeIdx = list.findIndex(
    (option) => option.id === activeRef.value?.id,
  )

  // Calculate next index and exit if it's out of bounds
  const nextIdx = activeIdx + dir

  if (nextIdx < 0 || nextIdx > list.length - 1) {
    return
  }

  activeRef.value = list[nextIdx]! // We know it's in bounds from the check above

  if (!activeRef.value) {
    return
  }

  // Scroll to the active option
  document?.getElementById(getOptionId(activeRef.value))?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

function addNew() {
  emit('add')
  query.value = ''
}

/**
 * Space toggles the active option in multiselect mode while the search box is empty.
 *
 * The options look like checkboxes, so keyboard users press Space to toggle them. Without this
 * handler Space types a leading space into the query, which filters out every option whose label
 * has no space and hides the whole list without any feedback (found by an accessibility audit).
 * Once a query has been typed, Space keeps inserting a character so multi-word labels stay
 * searchable. Key auto-repeat is ignored so holding Space after opening the popover with it does
 * not toggle the option repeatedly, and IME composition is left alone.
 */
const handleSpace = (event: KeyboardEvent): void => {
  if (!multiselect || query.value !== '' || event.isComposing) {
    return
  }
  // Suppress repeated spaces too, so holding the key does not start filtering.
  event.preventDefault()
  if (!event.repeat) {
    toggleSelected(activeRef.value)
  }
}

// Manual autofocus for the input
const input = ref<HTMLInputElement | null>(null)

// This must be a setTimeout to ensure there is no scroll jump. nextTick does not work here.
onMounted(() => setTimeout(() => input.value?.focus(), 0))
</script>
<template>
  <!-- Inset to line up with the options below -->
  <div class="relative flex items-center m-1 mb-0.75">
    <ScalarIconMagnifyingGlass
      class="pointer-events-none absolute left-1.75 top-1/2 -translate-y-1/2 text-c-3 size-4" />
    <input
      ref="input"
      v-model="query"
      :aria-activedescendant="activeRef ? getOptionId(activeRef) : undefined"
      aria-autocomplete="list"
      :aria-controls="id"
      :aria-expanded="showList"
      :aria-label="inputLabel"
      class="min-w-0 flex-1 rounded-md border-0 py-1.5 pl-7.25 leading-none text-c-1"
      :class="showSearchEnd ? 'pr-7.25' : 'pr-1.75'"
      data-1p-ignore
      :placeholder
      role="combobox"
      tabindex="0"
      type="text"
      @keydown.down.prevent="moveActive(1)"
      @keydown.enter.prevent="activeRef && toggleSelected(activeRef)"
      @keydown.esc.prevent="close?.()"
      @keydown.space="handleSpace"
      @keydown.up.prevent="moveActive(-1)" />
    <div
      v-if="showSearchEnd"
      class="absolute right-1.75 top-1/2 flex -translate-y-1/2 items-center">
      <slot
        :loader
        name="search-end">
        <ScalarLoading
          v-if="loader?.isActive"
          :loader
          size="md" />
      </slot>
    </div>
  </div>
  <ul
    v-show="showList"
    :id="id"
    :aria-busy="isLoading"
    :aria-multiselectable="multiselect"
    class="border-t p-0.75 custom-scroll overscroll-contain flex-1 min-h-0"
    role="listbox"
    tabindex="-1">
    <template v-if="showSkeleton">
      <li
        v-for="idx in 3"
        :key="idx"
        aria-hidden="true"
        class="flex px-2 py-1.5"
        role="presentation">
        <div
          class="h-lh rounded-md bg-b-3 animate-pulse"
          :class="idx === 3 ? 'w-2/3' : 'w-full'" />
      </li>
    </template>
    <li
      v-else-if="!filtered.length && !slots.add && noResults && !isLoading"
      class="text-c-3 px-2.5 py-2"
      role="status">
      {{ noResults }}
    </li>
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
          :group
          name="group" />
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
          v-slot="{ active, selected }"
          :active="activeRef?.id === option.id"
          :selected="model.some((o) => o.id === option.id)"
          @click="toggleSelected(option)"
          @mousedown.prevent
          @mouseenter="activeRef = option">
          <slot
            v-if="$slots.option"
            :active
            name="option"
            :option
            :selected />
          <template v-else>
            <ScalarListboxCheckbox
              :multiselect
              :selected="model.some((o) => o.id === option.id)" />
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
      v-slot="{ active }"
      :active="activeRef?.id === addOption.id"
      @click="addNew"
      @mousedown.prevent
      @mouseenter="activeRef = addOption">
      <ScalarIconPlus class="size-4 p-px" />
      <slot
        :active
        name="add" />
    </ComboboxOption>
  </ul>
</template>
