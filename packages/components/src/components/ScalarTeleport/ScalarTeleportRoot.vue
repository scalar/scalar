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
import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'
import { useTemplateRef } from 'vue'

import { useProvideTeleport } from './useTeleport'

const props = defineProps<{
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

const root = useDocumentRoot()
const target = useTemplateRef<HTMLElement>('target')
const id = useProvideTeleport(
  props.id,
  typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot
    ? target
    : undefined,
)
</script>
<template>
  <slot />
  <div
    :id="id"
    ref="target"
    class="scalar-teleport-root contents" />
</template>
