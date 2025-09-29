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

defineProps<{ open?: Boolean }>()
</script>
<template>
  <ScalarFormInput>
    <div class="flex-1 text-left min-w-0 truncate"><slot /></div>
    <ScalarIconCaretDown
      class="transition-transform size-3.5"
      :class="{ 'rotate-180': open }" />
  </ScalarFormInput>
</template>
