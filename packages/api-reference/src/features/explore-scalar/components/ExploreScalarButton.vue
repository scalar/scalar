<script setup lang="ts">
import type { ModalState } from '@scalar/components/modal'
import { supportsViewTransitions } from '@scalar/helpers/dom/start-view-transition'
import { ScalarIconSparkle } from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  useId,
  type Component,
} from 'vue'

import { useLocalization } from '@/features/localization'

import { EXPLORE_TRANSITION_NAMES, type ExploreSticker } from '../constants'
import { useExploreScalarTransition } from '../use-explore-scalar-transition'

defineProps<{
  externalUrls: ExternalUrls
  url?: string
  workspace: WorkspaceStore
}>()

/** Pointer must rest on the bar this long before it expands, so a pass-through does not flicker it */
const HOVER_INTENT_DELAY = 90

const { translate } = useLocalization()
const { toast } = useToasts()

const cardEl = ref<HTMLElement>()
const triggerEl = ref<HTMLButtonElement>()
const headlineId = useId()

// ---- Lazy chunks ----

const StickersComponent = shallowRef<Component>()
const ModalComponent = shallowRef<Component>()
let chunks: Promise<void> | undefined

/**
 * Both chunks are small; the resolved components are stored so they mount synchronously inside the
 * view transition callback (an async component wrapper would add a tick before the new snapshot).
 */
const warmChunks = (): Promise<void> =>
  (chunks ??= Promise.all([
    import('./ExploreScalarStickers.vue'),
    import('./ExploreScalarModal.vue'),
  ])
    .then(([stickers, modal]) => {
      StickersComponent.value = stickers.default
      ModalComponent.value = modal.default
    })
    .catch((error: unknown) => {
      // Let the next interaction retry the import
      chunks = undefined
      throw error
    }))

/** Warms the chunks without surfacing a failed import; `open()` awaits them again and toasts if they still fail */
const warmChunksQuietly = (): void => {
  void warmChunks().catch(() => undefined)
}

// Only ever runs on localhost, so the chunks are fetched ahead of the first hover
onMounted(warmChunksQuietly)

// ---- Expanded state (mirrored to `data-expanded`, the only thing the open-state CSS keys off) ----

const expanded = ref(false)

/** Applies the expanded layout without transitions, so the close morph has a laid-out destination */
const instant = ref(false)

/** While a morph runs, hover and focus changes must not collapse the card */
let pinned = false

let hoverTimer: ReturnType<typeof setTimeout> | undefined

const clearHoverTimer = (): void => {
  if (hoverTimer !== undefined) {
    clearTimeout(hoverTimer)
    hoverTimer = undefined
  }
}

/** Touch screens report no hover, so a tap never leaves a half-expanded card under the dialog */
const canHover = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(hover: hover)').matches ?? false)

/** Mouse-origin focus (for example restored after the dialog closes) does not expand the card */
const isFocusVisible = (element: Element | undefined): boolean => {
  try {
    return element?.matches(':focus-visible') ?? false
  } catch {
    return false
  }
}

const onPointerEnter = (): void => {
  warmChunksQuietly()

  if (!canHover() || modalState.open) {
    return
  }

  clearHoverTimer()
  hoverTimer = setTimeout(() => {
    hoverTimer = undefined
    if (!modalState.open) {
      expanded.value = true
    }
  }, HOVER_INTENT_DELAY)
}

const onPointerLeave = (): void => {
  clearHoverTimer()

  if (!pinned && !modalState.open) {
    expanded.value = false
  }
}

const onFocusIn = (): void => {
  warmChunksQuietly()

  if (isFocusVisible(triggerEl.value)) {
    expanded.value = true
  }
}

const onFocusOut = (): void => {
  if (!pinned && !modalState.open) {
    expanded.value = false
  }
}

onBeforeUnmount(clearHoverTimer)

// ---- Dialog choreography ----

const { run, isTransitioning, usesViewTransition } =
  useExploreScalarTransition()

/** Guards the awaits before a run starts, so a double activation cannot open twice */
let busy = false

/**
 * Whether the stickers take part in the morph. They only can when the card is already expanded
 * (hover or keyboard), because a view transition captures named elements without any ancestor
 * clipping: naming the stickers of a collapsed card would fly three invisible, below-the-bar
 * images out from under the footer. On touch the stickers simply fade in with the panel.
 */
const morphStickers = ref(false)

/**
 * A name may exist on one element per snapshot, so the card side carries its names as inline
 * styles only while a run needs them; the modal side gets them from CSS scoped to the root attribute.
 */
const setCardNames = (on: boolean): void => {
  const card = cardEl.value
  if (!card) {
    return
  }

  card.style.viewTransitionName = on ? EXPLORE_TRANSITION_NAMES.card : ''
  card.querySelectorAll<HTMLElement>('[data-sticker]').forEach((el) => {
    const key = el.dataset.sticker as ExploreSticker
    el.style.viewTransitionName =
      on && morphStickers.value ? EXPLORE_TRANSITION_NAMES[key] : ''
  })
}

const open = async (): Promise<void> => {
  if (busy || isTransitioning.value || modalState.open) {
    return
  }

  busy = true
  try {
    // Normally resolved on mount; guarantees the dialog can mount synchronously below
    try {
      await warmChunks()
    } catch {
      toast(translate('developerTools.unknownError'), 'error')
      return
    }

    const vt = supportsViewTransitions()
    // Adds the morphing class before the dialog mounts, so its own keyframes never start
    usesViewTransition.value = vt
    morphStickers.value = vt && expanded.value

    // Pin: mouse and keyboard users are already expanded; touch morphs from the bar
    pinned = true
    clearHoverTimer()
    expanded.value = true

    if (vt) {
      await nextTick()
      setCardNames(true)
    }

    await run('open', async () => {
      // Names move from the card to the mounted panel and hero stickers
      setCardNames(false)
      modalState.open = true

      if (vt) {
        // The unnamed card is part of the new root snapshot, so it must already be the plain bar
        // there: otherwise a second, crisp copy of the expanded card sits in the sidebar while
        // the real one flies to the centre
        instant.value = true
        expanded.value = false
      }

      await nextTick()
    })

    // The pointer is over the backdrop now; the card collapses quietly behind the dialog
    instant.value = false
    expanded.value = false
  } finally {
    pinned = false
    busy = false
  }
}

const close = async (): Promise<void> => {
  if (busy || isTransitioning.value || !modalState.open) {
    return
  }

  busy = true
  try {
    if (!usesViewTransition.value) {
      modalState.open = false
      await nextTick()
      // Focus is restored to the trigger by then; keyboard users keep the card open
      expanded.value = isFocusVisible(triggerEl.value)
      return
    }

    pinned = true
    clearHoverTimer()
    // The hero stickers fly back into the card, so they need their names in the old snapshot
    morphStickers.value = true
    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    await run('close', async () => {
      // The old snapshot already captured the panel, the hero stickers and the plain bar under
      // the backdrop. Only now is the card laid out expanded, without transitions, so the new
      // snapshot has a real destination that never showed through the backdrop as a static copy.
      modalState.open = false
      instant.value = true
      expanded.value = true
      await nextTick()
      // New snapshot: the expanded card with its stickers
      setCardNames(true)
    })

    setCardNames(false)
    usesViewTransition.value = false

    // Re-enable transitions and flush styles first, then let the card collapse with its ease-in
    instant.value = false
    await nextTick()
    void cardEl.value?.offsetHeight
    expanded.value = isFocusVisible(triggerEl.value)
  } finally {
    pinned = false
    busy = false
  }
}

/** Shape-compatible with useModal(); ScalarModal calls state.hide() on Escape and backdrop, so every close path morphs */
const modalState: ModalState = reactive({
  open: false,
  show: () => void open(),
  hide: () => void close(),
})
</script>

<template>
  <!-- The only in-flow element: it never changes size, so the sidebar never reflows -->
  <div
    class="explore-scalar relative h-8"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave">
    <!-- Anchored to the bottom, so growth happens upward over the end of the navigation.
         The whole card opens the dialog (stickers and headline included); the button inside
         stays the accessible control, and its activation reaches this handler by bubbling. -->
    <div
      ref="cardEl"
      class="explore-scalar-card bg-b-1 text-sidebar-c-1 absolute inset-x-0 bottom-0 z-10 flex cursor-pointer flex-col overflow-hidden rounded"
      :data-expanded="expanded || undefined"
      :data-instant="instant || undefined"
      @click="() => void open()">
      <!-- Gradient skin: the gradient button recipe; it fades out when the card opens (background-image does not interpolate, opacity does) -->
      <span
        aria-hidden="true"
        class="explore-scalar-skin bg-b-1.5 from-b-1 to-b-2 pointer-events-none absolute inset-0 bg-linear-to-b dark:bg-linear-to-t" />

      <!-- Reveal area: 0fr while collapsed, hidden from assistive technology always; the dialog carries the real copy -->
      <div
        aria-hidden="true"
        class="explore-scalar-reveal grid">
        <div
          class="explore-scalar-reveal-inner flex min-h-0 flex-col items-center overflow-hidden">
          <component
            :is="StickersComponent"
            v-if="StickersComponent"
            layout="row" />
          <span
            :id="headlineId"
            class="explore-scalar-headline text-c-1 max-w-[220px] px-3 pt-3 text-center text-sm leading-snug font-bold text-balance">
            {{ translate('exploreScalar.headline') }}
          </span>
        </div>
      </div>

      <div class="explore-scalar-pill flex justify-center">
        <button
          ref="triggerEl"
          aria-haspopup="dialog"
          :aria-describedby="headlineId"
          class="explore-scalar-cta text-sidebar-c-1 relative z-10 flex h-[31px] items-center justify-center gap-1.5 px-3.5 text-sm font-medium whitespace-nowrap"
          type="button">
          <ScalarIconSparkle
            class="size-3.5"
            weight="bold" />
          {{ translate('exploreScalar.explore') }}
        </button>
      </div>
    </div>

    <component
      :is="ModalComponent"
      v-if="ModalComponent"
      :externalUrls="externalUrls"
      :morphStickers="morphStickers"
      :state="modalState"
      :url="url"
      :usesViewTransition="usesViewTransition"
      :workspace="workspace" />
  </div>
</template>

<style scoped>
.explore-scalar-card {
  --explore-ease-out: cubic-bezier(0.32, 0.72, 0, 1);
  --explore-ease-in: cubic-bezier(0.4, 0, 0.2, 1);
  /* A real border: an inset hairline shadow would be painted under the gradient skin and never show */
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}
/* The 1px specular highlight of the gradient button lives on the skin, so it fades out with it */
.explore-scalar-skin {
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 0.7);
  transition: opacity 200ms var(--explore-ease-in);
}
.dark-mode .explore-scalar-skin {
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 0.06);
}
.explore-scalar-reveal {
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms var(--explore-ease-in);
}
/* No vertical padding while collapsed, so the trigger fills the 32px bar exactly */
.explore-scalar-pill {
  padding: 0;
  transition: padding 240ms var(--explore-ease-in);
}
/* The theme reset draws a 1px accent ring on :focus-visible; a 2px ring inset by 2px cannot be clipped by overflow: hidden */
.explore-scalar-cta:focus-visible {
  outline-width: 2px;
  outline-offset: -2px;
}
.explore-scalar-cta {
  flex: 1 1 auto;
  border-radius: var(--scalar-radius);
  background-color: transparent;
  transition:
    flex-grow 240ms var(--explore-ease-in),
    background-color 200ms var(--explore-ease-in),
    border-radius 240ms var(--explore-ease-in);
}
.explore-scalar-card :deep(.explore-scalar-sticker),
.explore-scalar-headline {
  opacity: 0;
  translate: 0 8px;
  transition:
    opacity 160ms var(--explore-ease-in),
    translate 160ms var(--explore-ease-in),
    scale 160ms var(--explore-ease-in);
}
.explore-scalar-card :deep(.explore-scalar-sticker) {
  scale: 0.92;
}

/* ---- Open state: a single selector, driven by the script ---- */
.explore-scalar-card[data-expanded] .explore-scalar-skin {
  opacity: 0;
}
.explore-scalar-card[data-expanded] .explore-scalar-reveal {
  grid-template-rows: 1fr;
  transition: grid-template-rows 360ms var(--explore-ease-out);
}
.explore-scalar-card[data-expanded] .explore-scalar-pill {
  padding: 12px 0;
  transition: padding 360ms var(--explore-ease-out);
}
.explore-scalar-card[data-expanded] .explore-scalar-cta {
  flex-grow: 0;
  background-color: var(--scalar-background-2);
  border-radius: var(--scalar-radius-full);
  transition:
    flex-grow 360ms var(--explore-ease-out),
    background-color 200ms var(--explore-ease-in),
    border-radius 360ms var(--explore-ease-out);
}
/* The one :hover rule left on purpose: it only tints the pill once the card is open and never drives the expansion */
.explore-scalar-card[data-expanded] .explore-scalar-cta:hover {
  background-color: var(--scalar-background-3);
}
.explore-scalar-card[data-expanded] :deep(.explore-scalar-sticker),
.explore-scalar-card[data-expanded] .explore-scalar-headline {
  opacity: 1;
  translate: 0 0;
  scale: 1;
  transition:
    opacity 220ms var(--explore-ease-out),
    translate 320ms var(--explore-ease-out),
    scale 320ms var(--explore-ease-out);
}
/* Stagger: stickers left to right, headline last, all inside the time the box takes to grow */
.explore-scalar-card[data-expanded] :deep([data-sticker='portals']) {
  transition-delay: 120ms;
}
.explore-scalar-card[data-expanded] :deep([data-sticker='sdks']) {
  transition-delay: 160ms;
}
.explore-scalar-card[data-expanded] :deep([data-sticker='agent']) {
  transition-delay: 200ms;
}
.explore-scalar-card[data-expanded] .explore-scalar-headline {
  transition-delay: 220ms;
}

/* Instant: a morph lays the card out synchronously, expanded before the close and collapsed inside the open */
.explore-scalar-card[data-instant],
.explore-scalar-card[data-instant] :deep(*) {
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}

/* There is no global reduced-motion rule in the repo, so the card declares its own */
@media (prefers-reduced-motion: reduce) {
  .explore-scalar-card,
  .explore-scalar-card :deep(*) {
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
  .explore-scalar-card :deep(.explore-scalar-sticker),
  .explore-scalar-headline {
    translate: 0 0;
    scale: 1;
  }
}
</style>
