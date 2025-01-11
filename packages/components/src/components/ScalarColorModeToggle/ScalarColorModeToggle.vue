<script lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'

import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'
import ScalarColorModeToggleIcon from './ScalarColorModeToggleIcon.vue'

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
const { variant = 'switch' } = defineProps<{
  /**
   * The style of the toggle.
   * @default 'switch'
   */
  variant?: 'switch' | 'icon'
}>()

const { isDarkMode, toggleColorMode, darkLightMode } = useColorMode()
</script>
<template>
  <ScalarColorModeToggleButton
    v-if="variant === 'switch'"
    v-model="isDarkMode" />
  <ScalarColorModeToggleIcon
    v-else
    :mode="darkLightMode"
    @click="toggleColorMode" />
</template>
