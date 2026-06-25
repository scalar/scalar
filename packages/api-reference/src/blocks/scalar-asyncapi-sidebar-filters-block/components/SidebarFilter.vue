<script setup lang="ts">
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { computed } from 'vue'

/**
 * SidebarFilter
 *
 * A single labeled row inside the AsyncAPI sidebar filter card: a left-aligned
 * label (e.g. "Protocol") next to a bordered `ScalarListbox` dropdown that fills
 * the remaining width. Reused for the stacked protocol and server filters.
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
  <div class="asyncapi-sidebar-filter flex items-center gap-2">
    <span class="text-c-1 w-20 shrink-0 text-base">{{ label }}</span>
    <div class="min-w-0 flex-1">
      <ScalarListbox
        v-slot="{ open }"
        :modelValue="selected"
        :options="options"
        resize
        @update:modelValue="(e) => emit('update:modelValue', e.id)">
        <button
          class="text-c-1 hover:bg-b-2 flex w-full cursor-pointer items-center gap-1 rounded border px-2.5 py-1.5 font-medium"
          type="button">
          <span
            class="overflow-hidden text-base text-ellipsis whitespace-nowrap">
            {{ selected?.label }}
          </span>
          <ScalarIconCaretDown
            class="ml-auto size-3 shrink-0 text-current transition-transform"
            :class="{ 'rotate-180': open }"
            weight="bold" />
        </button>
      </ScalarListbox>
    </div>
  </div>
</template>
