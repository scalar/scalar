<script lang="ts">
/**
 * Scalar Menu Section component
 *
 * Groups menu items under a divider with an optional title slot.
 *
 * @example
 * <ScalarMenuSection>
 *   <template #title>Section Title</template>
 *   <!-- menu items -->
 * </ScalarMenuSection>
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarDropdownDivider } from '../ScalarDropdown'

defineOptions({ inheritAttrs: false })
</script>
<template>
  <ScalarDropdownDivider />
  <slot />
</template>
