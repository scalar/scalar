<script lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { computed } from 'vue'

import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'
import ScalarColorModeToggleIcon from './ScalarColorModeToggleIcon.vue'
import ScalarColorModeToggleSelect from './ScalarColorModeToggleSelect.vue'

/**
 * Scalar Color Mode Toggle component
 *
 * A toggle that toggles between light and dark mode
 * using the {@link useColorMode} hook.
 *
 * @example
 *   <ScalarColorModeToggle />
 */
export default {}
</script>
<script lang="ts" setup>
const { variant = 'buttons' } = defineProps<{
  /**
   * The style of the toggle.
   * @default 'switch'
   */
  variant?: 'switch' | 'icon' | 'buttons'
}>()

const { isDarkMode, toggleColorMode, darkLightMode, colorMode } = useColorMode()

const ariaLabel = computed<string>(() =>
  isDarkMode.value ? 'Set light mode' : 'Set dark mode',
)
</script>
<template>
  <ScalarColorModeToggleButton
    v-if="variant === 'switch'"
    v-model="isDarkMode"
    :aria-label="ariaLabel" />
  <ScalarColorModeToggleSelect
    v-else-if="variant === 'buttons'"
    v-model="colorMode" />
  <ScalarColorModeToggleIcon
    v-else
    :aria-label="ariaLabel"
    :mode="darkLightMode"
    @click="toggleColorMode" />
</template>
