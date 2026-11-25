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
import { getActiveElement } from '@scalar/helpers/dom/get-active-element'
import { isShadowRoot } from '@scalar/helpers/dom/is-shadow-root'
import { useDocumentRoot } from '@scalar/use-hooks/useDocumentRoot'
import {
  type TeleportProps,
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  ssrContextKey,
  useTemplateRef,
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

/**
 * Inside a shadow root we look the target up ourselves and hand Vue the element
 *
 * Vue looks up selectors with `document.querySelector`, which cannot see into a shadow root,
 * so we run the same query on the shadow root instead, and `body` becomes the shadow root
 * itself. Whoever renders into a shadow root is expected to wrap it in a <ScalarTeleportRoot>
 * inside an element that carries the theme classes. Normal pages keep handing Vue the selector.
 *
 * `null` means the target is not there yet.
 */
const findTarget = (): TeleportProps['to'] | null => {
  const selector = to || root
  if (typeof selector !== 'string' || !isShadowRoot(documentRoot)) {
    return selector
  }
  return selector === 'body'
    ? documentRoot
    : documentRoot.querySelector(selector)
}

const target = shallowRef<TeleportProps['to'] | null>(findTarget())
// After the DOM update, so a new target rendered in the same update is there to find
watch(
  () => to,
  () => (target.value = findTarget()),
  { flush: 'post' },
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
const isServerRendering = inject<unknown>(ssrContextKey, null) !== null
const isHydrating = getCurrentInstance()?.vnode.el != null
const renderInPlace = ref<boolean>(isServerRendering || isHydrating)

/**
 * Vue looks up the target once, while it hydrates the teleport, and keeps
 * what it found. If the target is not on the page at that moment there is
 * nowhere to move the content to later, so it stays where it was rendered.
 */
const isTargetOnPage = (target: TeleportProps['to'] | null): boolean =>
  typeof target === 'string'
    ? document.querySelector(target) !== null
    : !!target
const canTeleport = !isHydrating || isTargetOnPage(target.value)

const content = useTemplateRef<HTMLElement>('content')

/**
 * A <ScalarTeleportRoot> renders its target after its slot, so we look again once mounted.
 *
 * Browsers drop focus from an element that moves, so content that focused itself while it
 * waited in place gets its focus back once it has moved.
 */
const findTargetAgain = (): void => {
  const focused = getActiveElement(documentRoot)
  target.value = findTarget()

  if (focused instanceof HTMLElement && content.value?.contains(focused)) {
    void nextTick(() => focused.focus())
  }
}

onMounted(() => {
  if (isWaitingForTarget.value) {
    findTargetAgain()
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
      ref="content"
      class="scalar-app"
      style="display: contents"
      v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>
