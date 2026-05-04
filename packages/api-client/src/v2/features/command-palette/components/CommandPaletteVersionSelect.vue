<script lang="ts">
/**
 * Command Palette Version Selector
 *
 * Renders a listbox for picking a specific loaded version of a
 * registry-grouped document. Used by the command palette flows that
 * target a document (Create Request, Add Tag, Add Example) so the user
 * can override the default "active version" target without leaving the
 * palette.
 *
 * The component intentionally stays passive: it does not own any state
 * beyond the one-way binding on `modelValue`, so the parent stays in
 * control of the selection lifecycle (resetting it when the document
 * changes, propagating it into the submit handler, ...).
 */
export default {
  name: 'CommandPaletteVersionSelect',
}
</script>

<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { computed } from 'vue'

import type { CommandPaletteDocumentVersion } from '../hooks/use-command-palette-documents'

const { modelValue, versions } = defineProps<{
  /** Currently selected version, or `undefined` while the parent is initialising. */
  modelValue: CommandPaletteDocumentVersion | undefined
  /** All loaded versions of the active document, in the order the registry advertises them. */
  versions: CommandPaletteDocumentVersion[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: CommandPaletteDocumentVersion): void
}>()

/**
 * `ScalarListbox` compares `modelValue` to options by reference, so we
 * have to surface the option object that lives inside `versions` rather
 * than build a fresh `{ id, label }` from the prop.
 */
const selectedOption = computed<CommandPaletteDocumentVersion | undefined>(
  () => (modelValue ? versions.find((v) => v.id === modelValue.id) : undefined),
)

const handleSelect = (
  option: CommandPaletteDocumentVersion | undefined,
): void => {
  if (option) {
    emit('update:modelValue', option)
  }
}
</script>

<template>
  <ScalarListbox
    :modelValue="selectedOption"
    :options="versions"
    @update:modelValue="handleSelect">
    <ScalarButton
      class="hover:bg-b-2 max-h-8 min-w-[80px] justify-between gap-1 p-2 text-xs"
      variant="outlined">
      <span :class="selectedOption ? 'text-c-1 truncate' : 'text-c-3'">
        {{ selectedOption ? selectedOption.label : 'Version' }}
      </span>
      <ScalarIcon
        class="text-c-3"
        icon="ChevronDown"
        size="md" />
    </ScalarButton>
  </ScalarListbox>
</template>
