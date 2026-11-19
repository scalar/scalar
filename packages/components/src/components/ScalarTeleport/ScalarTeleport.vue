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
import {
  type TeleportProps,
  getCurrentInstance,
  inject,
  onMounted,
  ref,
  ssrContextKey,
} from 'vue'

import { useTeleport } from './useTeleport'

const { to } = defineProps<{
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

/**
 * Server-rendered teleports stay in place until the component is mounted.
 *
 * Vue's server renderer does not put teleported content into the page. It
 * hands the content back separately and expects the host to place it in the
 * target. A host that embeds the server-rendered markup never receives it, so
 * during hydration Vue looks for the content in the target and hydrates over
 * whatever the host page has there.
 *
 * Rendering in place asks nothing of the host. The content is part of the
 * markup where the component is used, it is hydrated there, and it moves to
 * the target once the component is mounted. A component that is mounted
 * without server-rendered markup still teleports right away.
 *
 * @see https://vuejs.org/guide/scaling-up/ssr.html#teleports
 */
const isServerRendering = inject<unknown>(ssrContextKey, null) !== null
const isHydrating = getCurrentInstance()?.vnode.el != null
const renderInPlace = ref<boolean>(isServerRendering || isHydrating)

/**
 * Vue looks up the target once, while it hydrates the teleport, and keeps
 * what it found. If the target is not on the page at that moment there is
 * nowhere to move the content to later, so it stays where it was rendered.
 */
const isTargetOnPage = (target: TeleportProps['to']): boolean =>
  typeof target === 'string'
    ? document.querySelector(target) !== null
    : !!target
const canTeleport = !isHydrating || isTargetOnPage(to || root)

onMounted(() => {
  if (canTeleport) {
    renderInPlace.value = false
  }
})
</script>
<template>
  <Teleport
    :defer="!immediate"
    :disabled="disabled || renderInPlace"
    :to="to || root">
    <div
      class="scalar-app"
      style="display: contents"
      v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
