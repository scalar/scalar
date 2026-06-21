<script setup lang="ts">
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import { computed } from 'vue'

/**
 * SidebarFilter
 *
 * A generic AsyncAPI sidebar filter that mirrors the multi-document `DocumentSelector`:
 * a single `ScalarListbox` dropdown rendered at the top of the sidebar. It is reused
 * for stacked filters (e.g. protocol, then server).
 *
 * `options` is expected to lead with an "All …" entry, which is also used as the
 * fallback selection — so the first option doubles as the cleared state.
 */
const props = defineProps<{
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
  <!-- Only worth showing when there is a real choice beyond the "All …" entry -->
  <div
    v-if="options.length > 2"
    class="asyncapi-sidebar-filter px-3 pt-3">
    <ScalarListbox
      v-slot="{ open }"
      :modelValue="selected"
      :options="options"
      resize
      @update:modelValue="(e) => emit('update:modelValue', e.id)">
      <button
        class="group/dropdown-label text-c-2 hover:text-c-1 flex w-full cursor-pointer items-center gap-1 font-medium"
        type="button">
        <span class="overflow-hidden text-base text-ellipsis">
          {{ selected?.label }}
        </span>
        <ScalarIconCaretDown
          class="size-3 text-current transition-transform"
          :class="{ 'rotate-180': open }"
          weight="bold" />
      </button>
    </ScalarListbox>
  </div>
</template>
