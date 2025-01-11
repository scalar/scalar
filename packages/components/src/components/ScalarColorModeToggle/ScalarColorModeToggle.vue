<script lang="ts">
/**
 * Scalar Color Mode Toggle component
 *
 * A toggle that toggles between light and dark mode
 * using the @scalar/use-hooks/useColorMode hook.
 *
 * @example
 *   <ScalarColorModeToggle />
 */
export default {}
</script>
<script lang="ts" setup>
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import ScalarColorModeToggleButton from './ScalarColorModeToggleButton.vue'

const { isDarkMode } = useColorMode()
</script>
<template>
  <ScalarColorModeToggleButton v-model="isDarkMode" />
</template>
