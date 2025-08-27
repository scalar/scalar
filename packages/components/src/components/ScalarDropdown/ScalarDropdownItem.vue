<script lang="ts">
/**
 * Scalar dropdown item component
 *
 * Used to create items for the ScalarDropdown component
 *
 * @example
 * <ScalarDropdownItem ＠click="handleClick">
 *   Label
 * </ScalarDropdownItem>
 */
export default {}
</script>
<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'

import ScalarDropdownButton from './ScalarDropdownButton.vue'

defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>
<template>
  <MenuItem
    v-slot="{ active }"
    :disabled="disabled">
    <ScalarDropdownButton
      :active="active"
      :disabled="disabled"
      @click="(e: MouseEvent) => $emit('click', e)">
      <slot />
    </ScalarDropdownButton>
  </MenuItem>
</template>
<style scoped>
.dark-mode .scalar-dropdown-item:hover {
  filter: brightness(1.1);
}
</style>
