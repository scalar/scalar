<script setup lang="ts">
/**
 * This component allows dynamic selection of various layout configurations
 */
import { computed } from 'vue'

import type {
  ApiDefinitionSelectorSlot,
  InternalReferenceProps,
  ReferenceLayoutSlots,
} from '@/types'

import ClassicLayout from './ClassicLayout.vue'
import ModernLayout from './ModernLayout.vue'

const props = defineProps<InternalReferenceProps>()
defineEmits<{
  (e: 'toggleDarkMode'): void
  (e: 'updateContent', v: string): void
}>()

const slots = defineSlots<ReferenceLayoutSlots & ApiDefinitionSelectorSlot>()

// TODO: move to zod + safeParse to get typed instead of unknown
const referenceLayoutSlots = computed(
  (): ReferenceLayoutSlots =>
    Object.keys(slots).filter(
      (key) => key !== 'document-selector',
    ) as unknown as ReferenceLayoutSlots,
)

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
      v-for="(_, name) in referenceLayoutSlots"
      #[name]="slotProps">
      <slot
        :name="name"
        v-bind="slotProps || {}" />
    </template>
    <template #api-definition-selector>
      <slot name="api-definition-selector" />
    </template>
  </component>
</template>
