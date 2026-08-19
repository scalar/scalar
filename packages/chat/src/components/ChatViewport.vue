<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

import { CHAT_VIEWPORT_ANCHOR_ATTRIBUTE } from '@/components/chat-viewport'

/**
 * The scroll container of a chat thread, and its single scroll owner.
 *
 * Implements the hardened reserved-min-height anchor: after each user
 * message, enough space is reserved below the reply that the user message
 * can pin to the top of the viewport and hold still while the answer
 * streams. The reservation is clamped, falls back to stick-to-bottom when
 * the viewport is too short for pinning to make sense, collapses when
 * streaming completes, and recomputes through a ResizeObserver on this
 * element — never the window. Viewport units are banned in here; sizes come
 * from the element itself.
 *
 * Consumers mark each user message with the `CHAT_VIEWPORT_ANCHOR_ATTRIBUTE`
 * data attribute; the last one is the active anchor.
 */
const props = defineProps<{
  /** True while a response is streaming; the reservation releases when it flips false. */
  streaming: boolean
  /** Message count of the active chat; increases trigger anchoring. */
  messageCount: number
  /** Identity of the active chat; changes reset scroll to the true end of content. */
  chatKey?: string | number
}>()

const viewportRef = useTemplateRef<HTMLDivElement>('viewport')
const reserved = ref(0)

/**
 * Guards every async scroll write: chat switches, resizes and stream
 * completion each bump the epoch, so a stale callback can never scroll a
 * viewport that has since moved on. This is what makes scroll ownership
 * single and race-free.
 */
let epoch = 0

/** True while this component is writing scrollTop, so the scroll listener can tell user scrolls apart. */
let programmaticScroll = false

const userScrolledAway = ref(false)

const NEAR_BOTTOM_PX = 48
const MIN_USEFUL_RESERVATION_PX = 120
const RESERVATION_VIEWPORT_RATIO = 0.35

const anchorGap = (element: HTMLElement): number => {
  const raw = getComputedStyle(element)
    .getPropertyValue('--chat-anchor-gap')
    .trim()
  const parsed = Number.parseFloat(raw)

  return Number.isFinite(parsed) ? parsed : 16
}

const activeAnchor = (element: HTMLElement): HTMLElement | undefined => {
  const anchors = element.querySelectorAll<HTMLElement>(
    `[${CHAT_VIEWPORT_ANCHOR_ATTRIBUTE}]`,
  )

  return anchors[anchors.length - 1]
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/** The A6 reservation formula, with the short-viewport fallback threshold. */
const computeReservation = (): number => {
  const element = viewportRef.value

  if (!element) {
    return 0
  }

  const viewportHeight = element.clientHeight
  const gap = anchorGap(element)
  const anchorHeight = activeAnchor(element)?.offsetHeight ?? 0
  const reservation = clamp(
    viewportHeight - gap - anchorHeight - gap,
    0,
    viewportHeight,
  )

  if (
    reservation <
    Math.max(
      MIN_USEFUL_RESERVATION_PX,
      RESERVATION_VIEWPORT_RATIO * viewportHeight,
    )
  ) {
    return 0
  }

  return reservation
}

const setScrollTop = (value: number): void => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  programmaticScroll = true
  element.scrollTop = value
  programmaticScroll = false
}

const scrollToEnd = (): void => {
  const element = viewportRef.value

  if (element) {
    setScrollTop(element.scrollHeight)
    userScrolledAway.value = false
  }
}

const scrollAnchorToTop = (): void => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  const anchor = activeAnchor(element)

  if (anchor) {
    setScrollTop(anchor.offsetTop - element.offsetTop - anchorGap(element))
  } else {
    setScrollTop(element.scrollHeight)
  }

  userScrolledAway.value = false
}

/** A new exchange started: reserve space and pin, or stick to the bottom on short viewports. */
const anchorNewExchange = async (): Promise<void> => {
  const currentEpoch = ++epoch

  await nextTick()

  if (currentEpoch !== epoch) {
    return
  }

  reserved.value = computeReservation()

  await nextTick()

  if (currentEpoch !== epoch) {
    return
  }

  if (reserved.value > 0) {
    scrollAnchorToTop()
  } else {
    scrollToEnd()
  }
}

const onScroll = (): void => {
  const element = viewportRef.value

  if (!element || programmaticScroll) {
    return
  }

  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight

  userScrolledAway.value = distanceFromBottom > NEAR_BOTTOM_PX + reserved.value
}

watch(
  () => props.messageCount,
  (count, previous) => {
    if (count > (previous ?? 0)) {
      void anchorNewExchange()
    }
  },
)

watch(
  () => props.streaming,
  (streaming) => {
    if (!streaming) {
      // Release: no finished answer leaves a viewport-sized blank tail.
      epoch += 1
      reserved.value = 0
    }
  },
)

watch(
  () => props.chatKey,
  async () => {
    // Restored or switched chats open at the true end of content.
    const currentEpoch = ++epoch
    reserved.value = 0

    await nextTick()

    if (currentEpoch === epoch) {
      scrollToEnd()
    }
  },
)

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  // Restored chats open scrolled to the end, never into a reservation.
  scrollToEnd()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      const currentEpoch = epoch

      if (props.streaming && reserved.value > 0) {
        reserved.value = computeReservation()
        return
      }

      if (!userScrolledAway.value) {
        void nextTick().then(() => {
          if (currentEpoch === epoch) {
            scrollToEnd()
          }
        })
      }
    })
    resizeObserver.observe(element)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

defineExpose({ scrollToEnd })
</script>

<template>
  <div
    ref="viewport"
    class="chat-viewport"
    @scroll.passive="onScroll">
    <slot />
    <div
      class="chat-viewport-reservation"
      :style="{ height: `${reserved}px` }"
      aria-hidden="true" />
  </div>
</template>

<style scoped>
.chat-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /*
   * Keeps content above the reading line from shifting it when a tool card
   * expands, where the browser supports it. Manual scrollTop compensation
   * for browsers without overflow-anchor lands with the tool cards.
   * TODO: manual compensation fallback (Safari).
   */
  overflow-anchor: auto;
}
</style>
