<script lang="ts">
/**
 * Scalar Listbox Input component
 *
 * Provides a standard button for opening a listbox.
 *
 * @example
 * <ScalarListbox v-model="selected" :options v-slot="{ open }">
 *   <ScalarListboxInput :open>{{ selected.label }}</ScalarListboxInput>
 * </ScalarListbox>
 */
export default {}
</script>
<script setup lang="ts">
import { ScalarIconCaretDown } from '@scalar/icons'

import { ScalarFormInput } from '../ScalarForm'

defineProps<{ open?: boolean }>()
</script>
<template>
  <ScalarFormInput>
    <div class="min-w-0 flex-1 truncate text-left"><slot /></div>
    <ScalarIconCaretDown
      class="size-3.5 transition-transform"
      :class="{ 'rotate-180': open }" />
  </ScalarFormInput>
</template>
