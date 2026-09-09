<script lang="ts">
/**
 * Scalar Floating component
 *
 * Positions a floating element relative to a reference element
 * using Floating UI. Handles placement, offset, flipping, and resizing.
 *
 * @example
 * <ScalarFloating placement="bottom">
 *   <button>Reference</button>
 *   <template #floating>Floating content</template>
 * </ScalarFloating>
 */
export default {}
</script>
<script setup lang="ts">
import { getSideAxis } from '@floating-ui/utils'
import {
  type MiddlewareData,
  autoUpdate,
  flip,
  offset as offsetMiddleware,
  shift,
  size,
  useFloating,
} from '@floating-ui/vue'
import { type Ref, computed, nextTick, ref } from 'vue'

import { ScalarTeleport } from '../ScalarTeleport'
import type { FloatingOptions } from './types'
import { useResizeWithTarget } from './useResizeWithTarget'

const {
  placement,
  offset = 5,
  resize = false,
  middleware = [],
  target,
  teleport,
} = defineProps<FloatingOptions>()

defineSlots<{
  /** The reference element for the element in the #floating slot */
  default(): unknown
  /** The floating element */
  floating?(props: {
    /** The width of the reference element if `resize` is true and placement is on the y axis */
    width?: string
    /** The height of the reference element if `resize` is true and placement is on the x axis */
    height?: string
    /** The middleware data return by Floating UI */
    data?: MiddlewareData
  }): unknown
}>()

defineOptions({ inheritAttrs: false })

const floatingRef: Ref<HTMLElement | null> = ref(null)
const wrapperRef: Ref<HTMLElement | null> = ref(null)

const targetRef = computed<HTMLElement | undefined>(() => {
  if (typeof window !== 'undefined' && wrapperRef.value) {
    // If target is a string (id), try to find it in the document
    if (typeof target === 'string') {
      const t = document.getElementById(target)
      if (t) {
        return t
      }
      console.warn(`ScalarFloating: Target with id="${target}" not found`)
    }
    // If target is an HTMLElement, return it
    else if (target instanceof HTMLElement) {
      return target
    }
    // Fallback to div wrapper if no child element is provided
    const firstChild = wrapperRef.value.children?.[0]
    if (firstChild instanceof HTMLElement) {
      return firstChild
    }
    return wrapperRef.value
  }
  // Return undefined if nothing is found
  return undefined
})

const targetSize = useResizeWithTarget(targetRef, {
  enabled: computed(() => resize),
})

const targetWidth = computed(() =>
  getSideAxis(placement ?? 'bottom') === 'y'
    ? targetSize.width.value
    : undefined,
)

const targetHeight = computed(() =>
  getSideAxis(placement ?? 'bottom') === 'x'
    ? targetSize.height.value
    : undefined,
)

/**
 * Starts Floating UI's `autoUpdate` one tick after both elements exist.
 *
 * `useFloating` attaches `autoUpdate` from a synchronous watch the moment the
 * template refs resolve, and `autoUpdate` positions the element right away.
 * Template refs resolve in the post-render phase of a flush, so that first
 * `computePosition` reads layout while the same flush is still mounting other
 * components: every floating element mounted together (for example the closed
 * listboxes of a schema with many compositions) forces its own style recalc and
 * layout on a tree that was dirtied again in between. Waiting for `nextTick`
 * runs every first positioning back-to-back once the flush has settled, so the
 * browser recalculates the tree once for all of them. The tick resolves before
 * the next paint, so an element that mounts open is positioned in the same task.
 */
const deferredAutoUpdate: typeof autoUpdate = (
  reference,
  floating,
  update,
  options,
) => {
  let cleanup: (() => void) | undefined
  let disposed = false

  void nextTick(() => {
    if (!disposed) {
      cleanup = autoUpdate(reference, floating, update, options)
    }
  })

  return () => {
    disposed = true
    cleanup?.()
  }
}

const { floatingStyles, middlewareData } = useFloating(targetRef, floatingRef, {
  placement: computed(() => placement ?? 'bottom'),
  whileElementsMounted: deferredAutoUpdate,
  middleware: computed(() => [
    offsetMiddleware(offset),
    flip({ padding: 48 }),
    shift({ padding: 8 }),
    size({
      apply({ availableWidth, availableHeight, elements }) {
        // Assign the max width and height to the floating element
        // @see https://floating-ui.com/docs/size
        Object.assign(elements.floating.style, {
          maxWidth: `${Math.max(0, availableWidth) - 16}px`,
          maxHeight: `${Math.max(0, availableHeight) - 16}px`,
        })
      },
    }),
    ...middleware,
  ]),
})

defineExpose({
  /** The resolved target element */
  targetRef,
})
</script>
<template>
  <div
    ref="wrapperRef"
    :class="{ contents: !!$slots.default }">
    <slot />
  </div>
  <ScalarTeleport
    v-if="$slots.floating"
    :disabled="!teleport"
    :to="typeof teleport === 'string' ? teleport : undefined">
    <div
      ref="floatingRef"
      class="relative z-context"
      :style="floatingStyles">
      <slot
        :data="middlewareData"
        :height="targetHeight"
        name="floating"
        :width="targetWidth" />
    </div>
  </ScalarTeleport>
</template>
