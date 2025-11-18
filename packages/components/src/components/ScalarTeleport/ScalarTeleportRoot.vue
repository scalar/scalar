<script lang="ts">
/**
 * Scalar teleport root component
 *
 * Provides a teleport target for nested <ScalarTeleport> components
 *
 * @example
 * <ScalarTeleportRoot>
 *   ...
 *   <ScalarTeleport>
 *     <div>Teleported Content</div>
 *   </ScalarTeleport>
 *   ...
 * </ScalarTeleportRoot>
 */
export default {}
</script>
<script setup lang="ts">
import { useProvideTeleport } from './useTeleport'

defineProps<{
  /**
   * Override the default teleport target id
   */
  id?: string
}>()

defineSlots<{
  /** The content which contains <ScalarTeleports> */
  default(): unknown
}>()

defineOptions({ inheritAttrs: false })

const wrapper = useProvideTeleport()
</script>
<template>
  <slot />
  <div
    ref="wrapper"
    :id
    class="scalar-teleport-root contents" />
</template>
