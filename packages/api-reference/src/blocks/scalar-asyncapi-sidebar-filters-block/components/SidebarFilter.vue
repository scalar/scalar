<script setup lang="ts">
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarSidebarButton } from '@scalar/components/sidebar'
import { ScalarIconCaretUpDown } from '@scalar/icons'
import { computed } from 'vue'

/**
 * SidebarFilter
 *
 * A compact picker inside the AsyncAPI sidebar filters section. Reused for the
 * stacked protocol and server filters.
 *
 * `options` is expected to lead with an "All …" entry, which is also used as the
 * fallback selection — so the first option doubles as the cleared state.
 */
const props = defineProps<{
  /** Row label shown to the left of the dropdown (e.g. "Protocol"). */
  label: string
  /** Filter options, leading with the "All …" entry that clears the filter. */
  options: { id: string; label: string }[]
  /** The currently selected option id. */
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

/** Falls back to the first ("All …") option when nothing matches. */
const selected = computed(
  () =>
    props.options.find((o) => o.id === props.modelValue) ?? props.options[0],
)
</script>

<template>
  <li class="asyncapi-sidebar-filter min-w-0">
    <ScalarListbox
      :label="label"
      :modelValue="selected"
      :options="options"
      resize
      teleport
      @update:modelValue="(e) => emit('update:modelValue', e.id)">
      <ScalarSidebarButton
        is="button"
        class="w-full items-center text-left">
        <span class="text-c-1 truncate">
          {{ selected?.label }}
        </span>
        <template #aside>
          <ScalarIconCaretUpDown
            class="text-c-1 ml-1 size-3 shrink-0 self-center"
            weight="bold" />
        </template>
      </ScalarSidebarButton>
    </ScalarListbox>
  </li>
</template>
