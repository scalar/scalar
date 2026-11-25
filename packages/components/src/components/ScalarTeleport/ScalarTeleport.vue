<script lang="ts">
/**
 * Scalar teleport component
 *
 * Teleports the contents to the nearest <ScalarTeleportRoot>
 * Falls back to the default teleport target (body) if no root is found,
 * or to the shadow root when it renders inside one
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
import { isShadowRoot } from '@scalar/helpers/dom/is-shadow-root'
import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'
import {
  type TeleportProps,
  computed,
  getCurrentInstance,
  inject,
  onMounted,
  ref,
  shallowRef,
  ssrContextKey,
  watch,
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
const documentRoot = useDocumentRoot()
const isServerRendering = inject<unknown>(ssrContextKey, null) !== null

/**
 * We look the target up ourselves and hand Vue the element
 *
 * Vue looks up selectors with `document.querySelector`, which cannot see into a shadow root,
 * so we run the same query on the document root instead. In a shadow root, `body` becomes the
 * shadow root itself. Whoever renders into a shadow root is expected to wrap it in a
 * <ScalarTeleportRoot> inside an element that carries the theme classes.
 *
 * `null` means the target is not there yet. On the server there is no document, so the
 * selector is passed on as it is.
 */
const findTarget = (): TeleportProps['to'] | null => {
  const selector = to || root
  if (typeof selector !== 'string' || !documentRoot || isServerRendering) {
    return selector
  }
  return selector === 'body' && isShadowRoot(documentRoot)
    ? documentRoot
    : documentRoot.querySelector(selector)
}

const target = shallowRef<TeleportProps['to'] | null>(findTarget())
watch(
  () => [to, root],
  () => (target.value = findTarget()),
)

/**
 * Content waiting for its target stays in place and moves once the target is there.
 *
 * Vue moves the content when `disabled` and `to` change in the same update, so it is not
 * mounted again. A Teleport that is enabled without a target would not render it at all.
 */
const isWaitingForTarget = computed(() => target.value === null)

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
const isHydrating = getCurrentInstance()?.vnode.el != null
const renderInPlace = ref<boolean>(isServerRendering || isHydrating)

/**
 * Vue looks up the target once, while it hydrates the teleport, and keeps
 * what it found. If the target is not on the page at that moment there is
 * nowhere to move the content to later, so it stays where it was rendered.
 */
const canTeleport = !isHydrating || !isWaitingForTarget.value

onMounted(() => {
  // A <ScalarTeleportRoot> renders its target after its slot, so look again now that it is there
  if (isWaitingForTarget.value) {
    target.value = findTarget()
  }
  if (canTeleport) {
    renderInPlace.value = false
  }
})
</script>
<template>
  <Teleport
    :defer="!immediate"
    :disabled="disabled || renderInPlace || isWaitingForTarget"
    :to="target">
    <div
      class="scalar-app"
      style="display: contents"
      v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
