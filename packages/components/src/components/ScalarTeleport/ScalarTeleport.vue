<script lang="ts">
/**
 * Scalar teleport component
 *
 * Teleports the contents to the nearest <ScalarTeleportRoot>
 * Falls back to the default teleport target (body) if no root is found
 *
 * Is a wrapper around the Vue <Teleport> component and takes the same props
 *
 * @example
 *   <ScalarTeleport>
 *     <div>Teleported Content</div>
 *   </ScalarTeleport>
 */
export default {}
</script>
<script setup lang="ts">
import type { TeleportProps } from 'vue'

import { useTeleport } from './useTeleport'

defineProps<{
  /**
   * Override the default teleport target
   */
  to?: TeleportProps['to']
  /**
   * Whether to teleport immediately, disables the default defer behavior
   *
   * @see https://vuejs.org/guide/built-ins/teleport#deferred-teleport
   */
  immediate?: boolean
  /**
   * Whether to disable teleportation
   */
  disabled?: TeleportProps['disabled']
}>()

defineSlots<{
  /** The element to be teleported */
  default(): unknown
}>()

defineOptions({ inheritAttrs: false })

const root = useTeleport()
</script>
<template>
  <Teleport
    :defer="!immediate"
    :disabled="disabled"
    :to="to || root">
    <div
      class="scalar-app"
      style="display: contents"
      v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
