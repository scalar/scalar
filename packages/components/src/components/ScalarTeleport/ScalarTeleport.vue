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
import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'
import { type TeleportProps, computed, onMounted, ref, unref } from 'vue'

import { useTeleport } from './useTeleport'

const props = defineProps<{
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
const documentRoot = useDocumentRoot()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

/** Vue resolves selector targets against document; pass actual nodes inside shadow roots. */
const target = computed(() => {
  const value = props.to || unref<string | HTMLElement | null>(root)
  if (
    typeof ShadowRoot !== 'undefined' &&
    documentRoot instanceof ShadowRoot &&
    typeof value === 'string'
  ) {
    return value === 'body'
      ? documentRoot
      : mounted.value
        ? documentRoot.querySelector(value)
        : null
  }
  return value
})
</script>
<template>
  <Teleport
    v-if="disabled || target"
    :defer="!immediate"
    :disabled="disabled"
    :to="target">
    <div
      class="scalar-app"
      style="display: contents"
      v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
