<script setup lang="ts">
/**
 * This component allows dynamic selection of various layout configurations
 */
import type { ReferenceLayoutProps, ReferenceLayoutSlots } from '../../types'
import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const props = defineProps<ReferenceLayoutProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots>()

const layouts = {
  modern: ModernLayout,
  classic: ClassicLayout,
}
</script>
<template>
  <!-- Dynamic component to select a specific layout -->
  <component
    v-bind="props"
    :is="layouts[configuration.layout ?? 'modern'] ?? ModernLayout"
    @toggleDarkMode="$emit('toggleDarkMode')"
    @updateContent="$emit('updateContent', $event)">
    <!-- Expose all layout slots upwards -->
    <template
      v-for="(_, name) in slots"
      #[name]="slotProps">
      <slot
        :name="name"
        v-bind="slotProps || {}" />
    </template>
  </component>
</template>
