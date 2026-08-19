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
 * Implements the hardened reserved-min-height anchor: when a new exchange
 * starts, enough space is reserved below the reply that the user message can
 * pin to the top of the viewport and hold still while the answer streams.
 * The reservation is clamped, falls back to stick-to-bottom (which follows
 * content growth) when the viewport is too short for pinning to make sense,
 * collapses when streaming completes, and recomputes through a
 * ResizeObserver on this element — never the window. Viewport units are
 * banned in here; sizes come from the element itself.
 *
 * Consumers mark each user message with the `CHAT_VIEWPORT_ANCHOR_ATTRIBUTE`
 * data attribute; the last one is the active anchor. A new exchange is
 * signaled by `anchorKey` changing (pass the newest user message's id) —
 * never by message-count growth, so hydrating a restored chat or the
 * assistant message appending mid-stream cannot re-anchor or stomp the
 * user's scroll position.
 */
const props = defineProps<{
  /** True while a response is streaming; the reservation releases when it flips false. */
  streaming: boolean
  /** Identity of the newest user message. A change while streaming starts a new exchange. */
  anchorKey?: string | number
  /** Identity of the active chat; changes reset scroll to the true end of content. */
  chatKey?: string | number
}>()

const viewportRef = useTemplateRef<HTMLDivElement>('viewport')
const reserved = ref(0)

/**
 * Guards every async scroll write: chat switches and new exchanges each bump
 * the epoch, so a stale callback can never scroll a viewport that has since
 * moved on. This is what makes scroll ownership single and race-free.
 */
let epoch = 0

/** True while an exchange's reservation/pin sequence is still in flight. */
let anchorPending = false

/**
 * The last programmatically written scroll position. Scroll events fire
 * asynchronously in real browsers, so a synchronous flag cannot tell our
 * writes apart from the user's — the position itself can.
 */
let lastWrittenScrollTop: number | undefined

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

/** The reservation formula, with the short-viewport fallback threshold. */
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

/**
 * The distance from the bottom as of the last time this component looked —
 * updated on every scroll event, programmatic write and observer pass.
 * Follow decisions read this PRE-event value: the post-event distance
 * conflates appended content, above-viewport growth compensated by the
 * browser's scroll anchoring, and viewport shrinks with actual user intent.
 */
let lastDistanceFromBottom = 0

const measureDistanceFromBottom = (element: HTMLElement): number =>
  element.scrollHeight - element.scrollTop - element.clientHeight

const setScrollTop = (value: number): void => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  element.scrollTop = value
  // Read back after the write: the browser clamps to the scrollable range,
  // and the clamped value is what the async scroll event will report.
  lastWrittenScrollTop = element.scrollTop
  lastDistanceFromBottom = measureDistanceFromBottom(element)
}

const scrollToEnd = (): void => {
  const element = viewportRef.value

  if (element) {
    // End of CONTENT: the reservation spacer is not a destination — parking
    // an exposed jump-to-latest call inside a blank reserved tail would
    // strand the user on empty space for the rest of the stream.
    setScrollTop(
      Math.max(0, element.scrollHeight - reserved.value - element.clientHeight),
    )
    userScrolledAway.value = false
  }
}

/**
 * Offsets are measured with bounding rects, not `offsetTop` — a positioned
 * wrapper between the anchor and the viewport (a hover-toolbar message row)
 * would re-base `offsetTop` and break the arithmetic.
 */
const scrollAnchorToTop = (): void => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  const anchor = activeAnchor(element)

  if (anchor) {
    const anchorOffset =
      anchor.getBoundingClientRect().top -
      element.getBoundingClientRect().top +
      element.scrollTop

    setScrollTop(anchorOffset - anchorGap(element))
    userScrolledAway.value = false
    return
  }

  // No anchor to pin (contract breach or the element vanished mid-flush):
  // land at the end of CONTENT — the raw scrollHeight would park the user
  // inside the reservation spacer for the rest of the stream.
  scrollToEnd()
}

/** A new exchange started: reserve space and pin, or stick to the bottom on short viewports. */
const anchorNewExchange = async (): Promise<void> => {
  const currentEpoch = ++epoch
  anchorPending = true

  try {
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

    // The stream may have completed while the pin was in flight (the release
    // watcher skips releasing while anchorPending) — settle it here.
    if (!props.streaming) {
      reserved.value = 0
    }
  } finally {
    if (currentEpoch === epoch) {
      anchorPending = false
    }
  }
}

const onScroll = (): void => {
  const element = viewportRef.value

  if (!element) {
    return
  }

  if (
    lastWrittenScrollTop !== undefined &&
    Math.abs(element.scrollTop - lastWrittenScrollTop) <= 1
  ) {
    // Our own write arriving asynchronously — not the user.
    return
  }

  lastWrittenScrollTop = undefined

  const distanceFromBottom = measureDistanceFromBottom(element)

  lastDistanceFromBottom = distanceFromBottom
  userScrolledAway.value = distanceFromBottom > NEAR_BOTTOM_PX + reserved.value
}

watch(
  () => props.anchorKey,
  (anchorKey, previous) => {
    if (anchorKey === undefined || anchorKey === previous) {
      return
    }

    if (props.streaming) {
      void anchorNewExchange()
    } else {
      // A restored or hydrated chat: no exchange to pin, open at the end.
      // Epoch-guarded like every other deferred write, so a chat switch or
      // fresh anchor landing before the tick wins scroll ownership.
      const currentEpoch = epoch

      void nextTick().then(() => {
        if (currentEpoch === epoch) {
          scrollToEnd()
        }
      })
    }
  },
)

watch(
  () => props.streaming,
  (streaming) => {
    if (!streaming && !anchorPending) {
      // Release: no finished answer leaves a viewport-sized blank tail.
      // An in-flight anchor settles its own release (see anchorNewExchange).
      reserved.value = 0
    }
  },
)

watch(
  () => props.chatKey,
  async () => {
    // Restored or switched chats open at the true end of content.
    const currentEpoch = ++epoch
    anchorPending = false
    reserved.value = 0

    await nextTick()

    if (currentEpoch === epoch) {
      scrollToEnd()
    }
  },
)

/**
 * The follow decisions below read `lastDistanceFromBottom` — where the user
 * was BEFORE the event being handled — never the live post-event distance
 * and never the `userScrolledAway` flag. Observers can run before the
 * frame's coalesced scroll event dispatches (stale flag), appended content
 * inflates the live distance for a user who was at the bottom, a viewport
 * shrink inflates it without any user intent, and above-viewport growth
 * compensated by the browser's scroll anchoring inflates a growth heuristic
 * instead. The pre-event distance is the one signal that means what the
 * user actually did.
 */
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined

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
      const wasNearBottom =
        lastDistanceFromBottom <= NEAR_BOTTOM_PX + reserved.value

      if (props.streaming && reserved.value > 0) {
        reserved.value = computeReservation()

        if (reserved.value === 0) {
          // The shrink pushed the reservation under the threshold: the pin
          // is no longer viable, fall back to sticking at the content end.
          scrollToEnd()
        } else {
          lastDistanceFromBottom = measureDistanceFromBottom(element)
        }

        return
      }

      if (wasNearBottom) {
        void nextTick().then(() => {
          if (currentEpoch === epoch) {
            scrollToEnd()
          }
        })
      } else {
        lastDistanceFromBottom = measureDistanceFromBottom(element)
      }
    })
    resizeObserver.observe(element)
  }

  if (typeof MutationObserver !== 'undefined') {
    // Stick-to-bottom must follow the streamed reply as it grows — content
    // growth inside a fixed-height scroller never fires the ResizeObserver.
    mutationObserver = new MutationObserver(() => {
      const wasNearBottom = lastDistanceFromBottom <= NEAR_BOTTOM_PX

      if (!props.streaming || reserved.value > 0 || anchorPending) {
        lastDistanceFromBottom = measureDistanceFromBottom(element)
        return
      }

      if (wasNearBottom) {
        scrollToEnd()
      } else {
        lastDistanceFromBottom = measureDistanceFromBottom(element)
      }
    })
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})

defineExpose({ scrollToEnd, userScrolledAway })
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
  /* Positioned so absolutely-positioned descendants stay inside the scroller. */
  position: relative;
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
