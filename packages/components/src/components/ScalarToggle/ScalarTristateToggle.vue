<script lang="ts">
/**
 * Scalar Tristate Toggle component
 *
 * A switch-style toggle control with three states — unset, on, and off —
 * useful for representing an optional boolean that can also be left
 * unset (e.g. "inherit"). Supports a disabled state and accessible
 * labeling.
 *
 * @example
 * <ScalarTristateToggle v-model="overridden" label="Override default" />
 */
export default {}
</script>
<script setup lang="ts">
import { computed } from 'vue'

import ScalarToggleSlider from './ScalarToggleSlider.vue'

const props = defineProps<{
  /** Prevents the toggle from being cycled, and dims it visually. */
  disabled?: boolean
  /** Accessible label announced to assistive technology */
  label?: string
}>()

const model = defineModel<boolean | undefined>()

/** The current tristate value, derived from the boolean | undefined model. */
const state = computed<'unset' | 'on' | 'off'>(() => {
  if (model.value === undefined) {
    return 'unset'
  }
  return model.value ? 'on' : 'off'
})

/** Slider appearance for each tristate value. */
const SLIDER_PROPS = {
  unset: { class: '', thumb: 'center' },
  on: { class: 'bg-green', thumb: 'end' },
  off: { class: 'bg-c-danger', thumb: 'start' },
} as const

/** Cycles unset -> on -> off -> unset. */
function toggle() {
  if (props.disabled) {
    return
  }
  if (model.value === undefined) {
    model.value = true
  } else if (model.value === true) {
    model.value = false
  } else {
    model.value = undefined
  }
}
</script>
<template>
  <ScalarToggleSlider
    :aria-checked="state === 'unset' ? 'mixed' : model"
    :disabled
    :label
    role="checkbox"
    v-bind="SLIDER_PROPS[state]"
    @click="toggle" />
</template>
