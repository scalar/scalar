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
import { useDropdownItem } from '@/components/ScalarDropdown/useDropdown'
import { onBeforeUnmount, ref, useId, watch } from 'vue'

import ScalarDropdownButton from './ScalarDropdownButton.vue'

const { id = useId(), disabled } = defineProps<{
  id?: string
  disabled?: boolean
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const item = ref<HTMLElement>()

const { active, items } = useDropdownItem()

watch(item, (newItem) => {
  if (newItem) {
    items[id] = newItem
  }
})

onBeforeUnmount(() => delete items[id])
</script>
<template>
  <li
    class="contents"
    ref="item"
    role="menuitem"
    :id
    :aria-disabled="disabled">
    <ScalarDropdownButton
      :active="active === id"
      tabindex="-1"
      :disabled
      @mouseenter="active = id"
      @click="(e: MouseEvent) => $emit('click', e)">
      <slot />
    </ScalarDropdownButton>
  </li>
</template>
<style scoped>
.dark-mode .scalar-dropdown-item:hover {
  filter: brightness(1.1);
}
</style>
