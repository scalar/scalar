<script lang="ts" setup>
/**
 * Lazily renders content when the element is within the viewport overscan.
 * Uses a fixed-height placeholder so layout is stable while we block during render.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */

import { useIntersectionObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { requestLazyRender, useLazyBus } from '@/helpers/lazy-bus'

const { id, expanded = false } = defineProps<{
  /** Identifier for this lazy section; used for scroll-to and bus registration. */
  id: string
  /** When true, render the slot so child Lazy placeholders mount (e.g. for navigation). */
  expanded?: boolean
}>()

/** Fixed height for all placeholders so we do not measure or jump. */
const PLACEHOLDER_HEIGHT_PX = 760

/** Overscan: render items within this many pixels above and below the viewport. */
const VIEWPORT_OVERSCAN_PX = 1200
const VIEWPORT_ROOT_MARGIN = `${VIEWPORT_OVERSCAN_PX}px 0px`

const { isReady } = useLazyBus(id)
const lazyContainerRef = ref<HTMLElement | null>(null)
const isInViewport = ref(false)

/** Once ready we always show (no eviction). Otherwise show when in overscan or expanded. */
const shouldRender = computed(
  () =>
    (isReady.value || expanded) &&
    (typeof window === 'undefined' ||
      isInViewport.value ||
      expanded ||
      isReady.value),
)

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  if (!('IntersectionObserver' in window)) {
    requestLazyRender(id, true)
    return
  }

  useIntersectionObserver(
    lazyContainerRef,
    ([entry]) => {
      if (entry?.isIntersecting) {
        isInViewport.value = true
        if (!isReady.value) {
          requestLazyRender(id, true)
        }
      } else {
        isInViewport.value = false
      }
    },
    { rootMargin: VIEWPORT_ROOT_MARGIN },
  )
})
</script>
<template>
  <div
    :id="id"
    ref="lazyContainerRef"
    class="lazy-container">
    <div v-if="shouldRender">
      <slot />
    </div>
    <div
      v-else
      class="lazy-placeholder"
      :style="{ height: `${PLACEHOLDER_HEIGHT_PX}px` }" />
  </div>
</template>

<style scoped>
.lazy-container,
.lazy-placeholder {
  width: 100%;
}
</style>
