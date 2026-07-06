<script lang="ts">
/**
 * Scalar Toggle component
 *
 * A switch-style toggle control with support for
 * disabled state and accessible labeling.
 *
 * @example
 * <ScalarToggle v-model="enabled" label="Enable feature" />
 */
export default {}
</script>
<script setup lang="ts">
import ScalarToggleSlider from './ScalarToggleSlider.vue'

const props = defineProps<{
  disabled?: boolean
  label?: string
}>()

const model = defineModel<boolean>({ default: false })

function toggle() {
  if (props.disabled) {
    return
  }
  model.value = !model.value
}
</script>
<template>
  <ScalarToggleSlider
    :aria-checked="model"
    :class="model ? 'bg-c-accent' : ''"
    :disabled
    :label
    role="switch"
    :thumb="model ? 'end' : 'start'"
    @click="toggle" />
</template>
