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
import { type Ref, computed, ref } from 'vue'

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

const targetRef = computed(() => {
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
    return wrapperRef.value.children?.[0] || wrapperRef.value
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
const { floatingStyles, middlewareData } = useFloating(targetRef, floatingRef, {
  placement: computed(() => placement ?? 'bottom'),
  whileElementsMounted: autoUpdate,
  middleware: computed(() => [
    offsetMiddleware(offset),
    flip(),
    shift({ padding: 10 }),
    size({
      apply({ availableWidth, availableHeight, elements }) {
        // Assign the max width and height to the floating element
        // @see https://floating-ui.com/docs/size
        Object.assign(elements.floating.style, {
          maxWidth: `${Math.max(0, availableWidth) - 20}px`,
          maxHeight: `${Math.max(0, availableHeight) - 20}px`,
        })
      },
    }),
    ...middleware,
  ]),
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
