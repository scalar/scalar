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
import { useId } from 'vue'

import ScalarDropdownButton from './ScalarDropdownButton.vue'
import { useDropdownItem } from './useDropdown'

const { id = useId(), disabled } = defineProps<{
  id?: string
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const { active } = useDropdownItem()
</script>
<template>
  <ScalarDropdownButton
    :id
    :active="active === id"
    :disabled
    role="menuitem"
    tabindex="-1"
    @click="(e: MouseEvent) => $emit('click', e)"
    @mouseenter="active = id">
    <slot />
  </ScalarDropdownButton>
</template>
<style scoped>
.dark-mode .scalar-dropdown-item:hover {
  filter: brightness(1.1);
}
</style>
