<script setup lang="ts">
import { DialogTitle } from '@headlessui/vue'
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal, type ModalState } from '@scalar/components/modal'
import {
  ScalarIconArrowLeft,
  ScalarIconGlobe,
  ScalarIconPackage,
  ScalarIconX,
} from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, nextTick, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'
import { useRegisterLink } from '@/hooks/use-register-link'

import { mountCalInline } from '../cal-embed'
import { DEMO_CALL_URL } from '../constants'
import ExploreScalarStickers from './ExploreScalarStickers.vue'
import StickerMarc from './stickers/StickerMarc.vue'

const { externalUrls, url, workspace, state } = defineProps<{
  /** Shape-compatible with useModal(); every close path (X, Escape, backdrop) goes through state.hide() */
  state: ModalState
  externalUrls: ExternalUrls
  url?: string
  workspace: WorkspaceStore
  /** True while this open session was entered through a view transition, which replaces the modal's own keyframes */
  usesViewTransition: boolean
  /** True while the hero stickers take part in the morph (the card was expanded when it opened, or it is closing) */
  morphStickers: boolean
}>()

const { translate } = useLocalization()

const { loader, href, open } = useRegisterLink({
  externalUrls: () => externalUrls,
  url: () => url,
  workspace: () => workspace,
})

/**
 * The dialog has two steps: the overview, and the inline Cal.com booking for the demo call.
 * Declared before the open-state watch below, which runs immediately and resets it.
 */
const step = ref<'overview' | 'demo'>('overview')

/**
 * Decided once per open session. An upload defines `href` while the sign-up control has focus, and
 * swapping the focused <button> for an <a> at that moment drops keyboard focus to <body>. So the
 * element type stays put until the dialog closes; a later click on the button reuses the uploaded copy.
 */
const signUpIsLink = computed((): boolean => href.value !== undefined)
const sessionSignUpIsLink = ref(signUpIsLink.value)
watch(
  () => state.open,
  (isOpen) => {
    if (isOpen) {
      sessionSignUpIsLink.value = signUpIsLink.value
    } else {
      // The next open starts at the overview again
      step.value = 'overview'
    }
  },
  { immediate: true },
)
const signUpHref = computed((): string | undefined =>
  sessionSignUpIsLink.value ? href.value : undefined,
)

/** A public document is a plain link; inline and local documents are uploaded first */
const onSignUp = (): void => {
  if (signUpHref.value) {
    return
  }
  void open()
}

/** Marc's own sticker joins the wall while the demo call is hovered or focused */
const marcOnWall = ref(false)
const showMarc = (): void => {
  marcOnWall.value = true
}
const hideMarc = (): void => {
  marcOnWall.value = false
}

const panelEl = ref<HTMLElement>()
const stepEl = ref<HTMLElement>()
const backEl = ref<HTMLButtonElement>()
const calEl = ref<HTMLElement>()
const calFailed = ref(false)

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Swaps the step and morphs the dialog from the old step's size to the new one instead of snapping.
 * ScalarModal sizes the panel with an inline max-width, so the tween drives the measured width and
 * height with max-width lifted, and the new step fades in on top. A click mid-morph measures the
 * in-between size, so it carries on from there. Resolves once the size has settled.
 */
const changeStep = async (next: 'overview' | 'demo'): Promise<void> => {
  const box = panelEl.value?.closest<HTMLElement>('.scalar-modal')
  const from = box?.getBoundingClientRect()

  step.value = next
  // Leaving the overview unmounts the demo button without a mouseleave or blur
  marcOnWall.value = false
  await nextTick()

  if (
    !box ||
    !from ||
    typeof box.animate !== 'function' ||
    prefersReducedMotion()
  ) {
    return
  }

  const to = box.getBoundingClientRect()
  const resize = box.animate(
    [
      {
        width: `${from.width}px`,
        height: `${from.height}px`,
        maxWidth: 'none',
      },
      { width: `${to.width}px`, height: `${to.height}px`, maxWidth: 'none' },
    ],
    { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  )
  stepEl.value?.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 240,
    delay: 100,
    easing: 'ease',
    fill: 'backwards',
  })

  // Cancelled when the dialog closes mid-morph; nothing is left to settle then
  await resize.finished.catch(() => undefined)
}

/** The booking calendar follows the color mode of the surrounding reference */
const isDarkMode = (): boolean =>
  typeof document !== 'undefined' &&
  document.querySelector('.dark-mode') !== null

const showDemo = async (): Promise<void> => {
  calFailed.value = false
  const morph = changeStep('demo')
  await nextTick()
  backEl.value?.focus()

  // The calendar mounts once the dialog has its final width, so its iframe does not relayout every frame
  await morph
  if (step.value !== 'demo' || !calEl.value) {
    return
  }

  try {
    await mountCalInline(calEl.value, isDarkMode() ? 'dark' : 'light')
  } catch {
    // The booking page link under the calendar is the way out when the embed cannot load
    calFailed.value = true
  }
}

const showOverview = (): void => {
  void changeStep('overview')
}
</script>

<template>
  <ScalarModal
    bodyClass="!p-0 overflow-y-auto"
    class="explore-scalar-modal"
    :class="{
      'explore-scalar-modal--vt': usesViewTransition,
      'explore-scalar-modal--stickers': morphStickers,
    }"
    :maxWidth="step === 'demo' ? '960px' : '540px'"
    size="lg"
    :state="state">
    <div
      ref="panelEl"
      class="explore-scalar-panel bg-b-1 text-c-1 relative flex flex-col">
      <div
        v-if="step === 'overview'"
        ref="stepEl"
        class="flex flex-col">
        <!-- Hero: the brand gradient wash hugging the top edge, with the stickers as decoration -->
        <div
          class="explore-scalar-hero relative flex h-[200px] items-end justify-center overflow-hidden pb-6"
          :data-marc="marcOnWall ? '' : undefined">
          <span
            aria-hidden="true"
            class="explore-scalar-wash pointer-events-none absolute inset-x-0 top-0" />
          <ExploreScalarStickers layout="hero" />
          <!-- Centre stage, in front of the pile, once Marc is invited -->
          <StickerMarc
            class="explore-scalar-marc absolute bottom-5 left-[calc(50%-58px)] z-20 w-[116px] origin-bottom" />
        </div>

        <div class="px-8 pt-2 text-center">
          <DialogTitle
            as="h2"
            class="text-c-1 m-0 text-xl leading-snug font-bold tracking-tight text-balance">
            {{ translate('exploreScalar.title') }}
          </DialogTitle>
        </div>

        <hr class="border-border mx-8 mt-5 border-0 border-t" />

        <!-- WebKit drops the list role from a list-style: none list, so the role is explicit to keep "list, 2 items" -->
        <ul
          class="m-0 flex list-none flex-col gap-4 px-8 py-5"
          role="list">
          <li class="flex items-start gap-3">
            <!-- The icon shares the title's line box, so it sits on the title and the description hangs below -->
            <span class="text-c-1 flex h-6 shrink-0 items-center">
              <ScalarIconPackage
                class="size-5"
                weight="regular" />
            </span>
            <span class="flex flex-col gap-0.5">
              <span class="text-c-1 text-base leading-6 font-bold">
                {{ translate('exploreScalar.generateTitle') }}
              </span>
              <span class="text-c-2 text-sm">
                {{ translate('exploreScalar.generateDescription') }}
              </span>
            </span>
          </li>
          <li class="flex items-start gap-3">
            <span class="text-c-1 flex h-6 shrink-0 items-center">
              <ScalarIconGlobe
                class="size-5"
                weight="regular" />
            </span>
            <span class="flex flex-col gap-0.5">
              <span class="text-c-1 text-base leading-6 font-bold">
                {{ translate('exploreScalar.platformTitle') }}
              </span>
              <span class="text-c-2 text-sm">
                {{ translate('exploreScalar.platformDescription') }}
              </span>
            </span>
          </li>
        </ul>

        <!-- Sign-up comes first in the DOM so the dialog's initial focus lands on the primary action -->
        <div class="flex flex-col gap-1 px-8 pt-1 pb-6">
          <!-- The spinner hides the label, so the name is pinned while loading (the button is still announced as busy) -->
          <ScalarButton
            :is="signUpHref ? 'a' : 'button'"
            :aria-busy="loader.isLoading"
            :aria-label="
              loader.isActive ? translate('exploreScalar.signUp') : undefined
            "
            class="h-10 w-full rounded-full text-base"
            :href="signUpHref"
            :loader="loader"
            :rel="signUpHref ? 'noopener noreferrer' : undefined"
            :target="signUpHref ? '_blank' : undefined"
            variant="solid"
            @click="onSignUp">
            {{ translate('exploreScalar.signUp') }}
            <span class="sr-only">
              {{ translate('exploreScalar.opensInNewTab') }}
            </span>
          </ScalarButton>
          <!-- The quieter second path, read as a continuation of the primary action -->
          <ScalarButton
            class="bg-b-2 text-c-1 hover:bg-b-3 hover:text-c-1 active:bg-b-3 active:text-c-1 h-10 w-full rounded-full text-base font-medium"
            variant="ghost"
            @blur="hideMarc"
            @click="showDemo"
            @focus="showMarc"
            @mouseenter="showMarc"
            @mouseleave="hideMarc">
            {{ translate('exploreScalar.getDemo') }}
          </ScalarButton>
        </div>
      </div>

      <!-- Booking step: the Cal.com calendar for a call with Marc, rendered inline -->
      <div
        v-else
        ref="stepEl"
        class="flex flex-col px-6 pb-6">
        <!-- Back mirrors the close circle in the opposite corner; the arrow flips with the reading direction -->
        <button
          ref="backEl"
          :aria-label="translate('exploreScalar.back')"
          class="bg-b-1/70 text-c-2 hover:bg-b-2 hover:text-c-1 ring-border absolute start-3 top-3 z-10 flex size-8 items-center justify-center rounded-full shadow-sm ring-1"
          type="button"
          @click="showOverview">
          <ScalarIconArrowLeft class="size-4 rtl:-scale-x-100" />
        </button>
        <!-- The title row shares its vertical center with the two corner circles and stays clear of them -->
        <DialogTitle
          as="h2"
          class="text-c-1 m-0 flex min-h-14 items-center justify-center px-8 text-center text-xl leading-snug font-bold tracking-tight text-balance">
          {{ translate('exploreScalar.bookDemo') }}
        </DialogTitle>
        <!-- Cal.com mounts its booking iframe in here -->
        <div
          ref="calEl"
          class="explore-scalar-cal mt-2 min-h-[640px] w-full overflow-auto" />
        <p
          v-if="calFailed"
          class="text-c-2 m-0 pt-3 text-center text-sm">
          <a
            class="text-c-accent"
            :href="DEMO_CALL_URL"
            rel="noopener noreferrer"
            target="_blank">
            {{ translate('exploreScalar.openBookingPage') }}
            <span class="sr-only">
              {{ translate('exploreScalar.opensInNewTab') }}
            </span>
          </a>
        </p>
      </div>

      <!-- Close: the dashboard's close circle, last in the Tab order, at the inline end so RTL keeps it in the corner -->
      <button
        :aria-label="translate('exploreScalar.close')"
        class="bg-b-1/70 text-c-2 hover:bg-b-2 hover:text-c-1 ring-border absolute end-3 top-3 z-10 flex size-8 items-center justify-center rounded-full shadow-sm ring-1"
        type="button"
        @click="state.hide()">
        <ScalarIconX class="size-4" />
      </button>
    </div>
  </ScalarModal>
</template>

<!-- The dialog is portaled to <body>, outside this component's scope, so these rules are global and prefixed by the Dialog root class -->
<style>
/* The same corner as the dashboard's takeover card */
.explore-scalar-modal .scalar-modal {
  border-radius: 28px;
  overflow: hidden;
}

/*
 * While the View Transitions API drives the entrance, ScalarModal's own keyframes would be captured
 * at opacity 0 (the panel starts at opacity-0 with a 0.1s-delayed keyframe in scoped CSS). The
 * !important beats the scoped rule and the opacity-0 utility regardless of layer order. The class
 * stays for the whole open session because re-enabling `animation` restarts it and flashes the panel.
 */
.explore-scalar-modal--vt .scalar-modal-layout,
.explore-scalar-modal--vt .scalar-modal {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}

/*
 * The scalar.com brand gradient hugging the top edge, copied from the dashboard's
 * bg-brand-gradient-wash utility: the raw rainbow, faded out by a soft radial mask alone so its
 * colors stay unblurred and true. The theme's color variables keep it right in dark mode.
 */
.explore-scalar-wash {
  height: 48px;
  background-image: linear-gradient(
    90deg,
    var(--scalar-color-blue),
    var(--scalar-color-green) 16.6%,
    var(--scalar-color-accent) 24.9%,
    var(--scalar-color-orange) 41.5%,
    var(--scalar-color-yellow) 58.1%,
    var(--scalar-color-orange) 74.7%,
    var(--scalar-color-purple) 91.3%,
    var(--scalar-color-red)
  );
  -webkit-mask-image: radial-gradient(
    ellipse 60% 60% at 50% 0%,
    black,
    transparent 80%
  );
  mask-image: radial-gradient(
    ellipse 60% 60% at 50% 0%,
    black,
    transparent 80%
  );
}

/*
 * ---- Marc takes centre stage ----
 * While the demo call is hovered or focused, Marc's sticker rises into the middle of the wall
 * with a springy settle, and the three product stickers scatter outwards behind him: each slides
 * away from the centre, shrinks a little and tilts further, all on one unhurried ease, and
 * everything returns together on the way back. The stickers' resting tilt is an inline custom
 * property, so the scatter sets `rotate` itself (a stylesheet cannot override that variable).
 * Only the individual transform properties move; the fallback entrance keyframes own `transform`.
 */
.explore-scalar-modal .explore-scalar-hero .explore-scalar-sticker {
  transition:
    translate 360ms cubic-bezier(0.4, 0, 0.2, 1),
    scale 360ms cubic-bezier(0.4, 0, 0.2, 1),
    rotate 360ms cubic-bezier(0.4, 0, 0.2, 1);
}
.explore-scalar-modal .explore-scalar-hero[data-marc] .explore-scalar-sticker {
  transition:
    translate 560ms cubic-bezier(0.32, 0.72, 0, 1),
    scale 560ms cubic-bezier(0.32, 0.72, 0, 1),
    rotate 560ms cubic-bezier(0.32, 0.72, 0, 1);
}
.explore-scalar-modal .explore-scalar-hero[data-marc] [data-sticker='portals'] {
  rotate: -24deg;
  translate: -52px 14px;
  scale: 0.8;
}
.explore-scalar-modal .explore-scalar-hero[data-marc] [data-sticker='sdks'] {
  rotate: -16deg;
  translate: -60px -46px;
  scale: 0.78;
}
.explore-scalar-modal .explore-scalar-hero[data-marc] [data-sticker='agent'] {
  rotate: 22deg;
  translate: 16px 10px;
  scale: 0.8;
}
.explore-scalar-modal .explore-scalar-marc {
  opacity: 0;
  rotate: -12deg;
  scale: 0.55;
  translate: 0 28px;
  transition:
    opacity 160ms ease-in,
    scale 300ms cubic-bezier(0.4, 0, 0.2, 1),
    rotate 300ms cubic-bezier(0.4, 0, 0.2, 1),
    translate 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.explore-scalar-modal .explore-scalar-hero[data-marc] .explore-scalar-marc {
  opacity: 1;
  rotate: -4deg;
  scale: 1;
  translate: 0 0;
  transition:
    opacity 200ms ease-out,
    scale 620ms cubic-bezier(0.34, 1.35, 0.64, 1),
    rotate 620ms cubic-bezier(0.34, 1.35, 0.64, 1),
    translate 620ms cubic-bezier(0.34, 1.35, 0.64, 1);
}
@media (prefers-reduced-motion: reduce) {
  .explore-scalar-modal .explore-scalar-hero .explore-scalar-sticker,
  .explore-scalar-modal .explore-scalar-marc {
    transition: none;
  }
}

/*
 * ---- View transition: names on the modal side exist only while our transition runs ----
 * The stickers are only named when the card side has visible counterparts (see `morphStickers`);
 * otherwise they stay part of the panel image and crossfade in with it.
 */
:root[data-scalar-explore-vt] .explore-scalar-modal .scalar-modal {
  view-transition-name: scalar-explore-card;
}
:root[data-scalar-explore-vt]
  .explore-scalar-modal--stickers
  [data-sticker='portals'] {
  view-transition-name: scalar-explore-sticker-portals;
}
:root[data-scalar-explore-vt]
  .explore-scalar-modal--stickers
  [data-sticker='sdks'] {
  view-transition-name: scalar-explore-sticker-sdks;
}
:root[data-scalar-explore-vt]
  .explore-scalar-modal--stickers
  [data-sticker='agent'] {
  view-transition-name: scalar-explore-sticker-agent;
}

/* The page itself does not change; this only fades the backdrop */
:root[data-scalar-explore-vt]::view-transition-old(root),
:root[data-scalar-explore-vt]::view-transition-new(root) {
  animation-duration: 300ms;
}

:root[data-scalar-explore-vt]::view-transition-group(scalar-explore-card),
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-portals
  ),
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-sdks
  ),
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-agent
  ) {
  animation-duration: 440ms;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}
:root[data-scalar-explore-vt]::view-transition-group(scalar-explore-card) {
  z-index: 1;
}
/* Stickers ride above the card/panel group, with a slight overshoot on the fly-in */
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-portals
  ),
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-sdks
  ),
:root[data-scalar-explore-vt]::view-transition-group(
    scalar-explore-sticker-agent
  ) {
  z-index: 2;
  animation-timing-function: cubic-bezier(0.34, 1.2, 0.64, 1);
}
/* Stickers trail the box so the fan reads as three objects */
:root[data-scalar-explore-vt='open']::view-transition-group(
    scalar-explore-sticker-sdks
  ) {
  animation-delay: 40ms;
}
:root[data-scalar-explore-vt='open']::view-transition-group(
    scalar-explore-sticker-agent
  ) {
  animation-delay: 80ms;
}

/*
 * Card and panel have different aspect ratios: size both images to the animating box and crossfade
 * clipped, so nothing stretches. Both images are opaque, so the browser's default plus-lighter
 * blend inside the isolated pair keeps the box solid for the whole crossfade: the two fades share
 * one window and one easing, so old + new always add up to full opacity and the page never shows
 * through the morphing box.
 */
:root[data-scalar-explore-vt]::view-transition-image-pair(scalar-explore-card) {
  overflow: clip;
  isolation: isolate;
  animation: scalar-explore-radius 440ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
:root[data-scalar-explore-vt]::view-transition-old(scalar-explore-card),
:root[data-scalar-explore-vt]::view-transition-new(scalar-explore-card) {
  height: 100%;
  width: 100%;
  object-fit: cover;
  object-position: top center;
  mix-blend-mode: plus-lighter;
}
:root[data-scalar-explore-vt]::view-transition-old(scalar-explore-card) {
  animation: scalar-explore-fade-out 260ms ease both;
}
:root[data-scalar-explore-vt]::view-transition-new(scalar-explore-card) {
  animation: scalar-explore-fade-in 260ms ease both;
}
:root[data-scalar-explore-vt='close']::view-transition-image-pair(
    scalar-explore-card
  ) {
  animation-direction: reverse;
}
@keyframes scalar-explore-radius {
  from {
    border-radius: var(--scalar-radius);
  }
  to {
    border-radius: 28px;
  }
}
@keyframes scalar-explore-fade-out {
  to {
    opacity: 0;
  }
}
@keyframes scalar-explore-fade-in {
  from {
    opacity: 0;
  }
}

/* Identical artwork on both sides: hide the old image and let the new one ride the group transform */
:root[data-scalar-explore-vt]::view-transition-old(
    scalar-explore-sticker-portals
  ),
:root[data-scalar-explore-vt]::view-transition-old(scalar-explore-sticker-sdks),
:root[data-scalar-explore-vt]::view-transition-old(
    scalar-explore-sticker-agent
  ) {
  animation: none;
  opacity: 0;
}
:root[data-scalar-explore-vt]::view-transition-new(
    scalar-explore-sticker-portals
  ),
:root[data-scalar-explore-vt]::view-transition-new(scalar-explore-sticker-sdks),
:root[data-scalar-explore-vt]::view-transition-new(
    scalar-explore-sticker-agent
  ) {
  animation: none;
  height: 100%;
  width: 100%;
  object-fit: contain;
  mix-blend-mode: normal;
}

/* Closing is quicker, eases in, no stagger */
:root[data-scalar-explore-vt='close']::view-transition-group(
    scalar-explore-card
  ),
:root[data-scalar-explore-vt='close']::view-transition-group(
    scalar-explore-sticker-portals
  ),
:root[data-scalar-explore-vt='close']::view-transition-group(
    scalar-explore-sticker-sdks
  ),
:root[data-scalar-explore-vt='close']::view-transition-group(
    scalar-explore-sticker-agent
  ) {
  animation-duration: 320ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  animation-delay: 0ms;
}

/* The script never starts a transition under reduced motion; if one ever starts, keep it still */
@media (prefers-reduced-motion: reduce) {
  :root[data-scalar-explore-vt]::view-transition-group(*),
  :root[data-scalar-explore-vt]::view-transition-old(*),
  :root[data-scalar-explore-vt]::view-transition-new(*) {
    animation: none !important;
  }
}

/* ---- Fallback without the API: ScalarModal's fade plays, plus a staggered sticker pop ---- */
.explore-scalar-modal:not(.explore-scalar-modal--vt)
  .explore-scalar-hero
  .explore-scalar-sticker {
  animation: scalar-explore-sticker-pop 360ms cubic-bezier(0.34, 1.3, 0.4, 1)
    both;
}
.explore-scalar-modal:not(.explore-scalar-modal--vt)
  .explore-scalar-hero
  [data-sticker='sdks'] {
  animation-delay: 60ms;
}
.explore-scalar-modal:not(.explore-scalar-modal--vt)
  .explore-scalar-hero
  [data-sticker='agent'] {
  animation-delay: 120ms;
}
/* Rotation is the sticker's own `rotate` property, so the keyframe leaves it alone */
@keyframes scalar-explore-sticker-pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .explore-scalar-modal .explore-scalar-sticker {
    animation: none !important;
  }
}
</style>
