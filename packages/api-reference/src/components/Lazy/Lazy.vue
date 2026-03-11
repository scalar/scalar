<script lang="ts" setup>
/**
 * Lazily renders content when the browser has idle time available.
 *
 * When server-side rendering, content renders immediately.
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f
 */

import { useIntersectionObserver } from '@vueuse/core'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import {
  getLazyPlaceholderHeight,
  requestLazyRender,
  setLazyPlaceholderHeight,
  useLazyBus,
} from '@/helpers/lazy-bus'

const { id, persist = false, expanded = false } = defineProps<{
  // Identifier for loaded event, if no ID is passed then no event is dispatched
  id: string
  /** Keep mounted once loaded (skip viewport unmounting). */
  persist?: boolean
  /** When true, render the slot so child Lazy placeholders mount and navigation can scroll to them. */
  expanded?: boolean
}>()

/**
 * Stripe-like operation sections are very dense and scroll fast.
 * Larger overscan and a taller placeholder keep hydration ahead of the scroll cursor.
 */
const DEFAULT_PLACEHOLDER_HEIGHT = 760
const VIEWPORT_ROOT_MARGIN = '1400px 0px 1800px 0px'
const VIEWPORT_LEAVE_DELAY_MS = 220

const { isReady } = useLazyBus(id)

const lazyContainerRef = ref<HTMLElement | null>(null)
const lazyContentRef = ref<HTMLElement | null>(null)
const isInViewport = ref(true)
const placeholderHeight = ref(
  getLazyPlaceholderHeight(id) ?? DEFAULT_PLACEHOLDER_HEIGHT,
)

let contentResizeObserver: ResizeObserver | null = null
let leaveViewportTimeout: number | undefined

const shouldRender = computed(
  () =>
    (isReady.value || expanded) &&
    (persist ||
      typeof window === 'undefined' ||
      isInViewport.value ||
      expanded),
)

const measureContent = (): void => {
  if (!lazyContentRef.value) {
    return
  }

  const nextHeight = lazyContentRef.value.offsetHeight
  if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
    return
  }

  placeholderHeight.value = nextHeight
  setLazyPlaceholderHeight(id, nextHeight)
}

watch(shouldRender, (rendered) => {
  if (!rendered) {
    contentResizeObserver?.disconnect()
    return
  }

  void nextTick(() => {
    measureContent()

    if (!lazyContentRef.value) {
      return
    }

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    if (!contentResizeObserver) {
      contentResizeObserver = new ResizeObserver(() => {
        measureContent()
      })
    }

    contentResizeObserver.observe(lazyContentRef.value)
  })
})

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  if (!('IntersectionObserver' in window)) {
    isInViewport.value = true
    return
  }

  useIntersectionObserver(
    lazyContainerRef,
    ([entry]) => {
      if (entry?.isIntersecting) {
        if (leaveViewportTimeout) {
          window.clearTimeout(leaveViewportTimeout)
          leaveViewportTimeout = undefined
        }
        isInViewport.value = true
        if (!isReady.value) {
          requestLazyRender(id, true)
        }
        return
      }

      leaveViewportTimeout = window.setTimeout(() => {
        isInViewport.value = false
      }, VIEWPORT_LEAVE_DELAY_MS)
    },
    { rootMargin: VIEWPORT_ROOT_MARGIN },
  )
})

onBeforeUnmount(() => {
  contentResizeObserver?.disconnect()
  if (leaveViewportTimeout) {
    window.clearTimeout(leaveViewportTimeout)
  }
})
</script>
<template>
  <div
    :id="id"
    ref="lazyContainerRef"
    class="lazy-container">
    <div
      v-if="shouldRender"
      ref="lazyContentRef">
      <slot />
    </div>
    <div
      v-else
      class="lazy-placeholder"
      :style="{ height: `${placeholderHeight}px` }" />
  </div>
</template>

<style scoped>
.lazy-container,
.lazy-placeholder {
  width: 100%;
}
</style>
