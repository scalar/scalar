<script lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'

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
import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'

defineSlots<{
  default: (props: ReturnType<typeof useColorMode>) => any
}>()

const { isDarkMode } = useColorMode()
</script>
<template>
  <ScalarColorModeToggleButton v-model="isDarkMode" />
</template>
