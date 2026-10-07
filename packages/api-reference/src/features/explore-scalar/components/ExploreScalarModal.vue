<script setup lang="ts">
import { DialogTitle } from '@headlessui/vue'
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarModal, type ModalState } from '@scalar/components/modal'
import {
  ScalarIconArrowUpRight,
  ScalarIconCalendar,
  ScalarIconGlobe,
  ScalarIconPackage,
  ScalarIconX,
} from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref, watch } from 'vue'

import { useLocalization } from '@/features/localization'
import { useRegisterLink } from '@/hooks/use-register-link'

import { DEMO_CALL_URL } from '../constants'
import ExploreScalarStickers from './ExploreScalarStickers.vue'

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
</script>

<template>
  <ScalarModal
    bodyClass="!p-0 overflow-y-auto"
    class="explore-scalar-modal"
    :class="{
      'explore-scalar-modal--vt': usesViewTransition,
      'explore-scalar-modal--stickers': morphStickers,
    }"
    maxWidth="540px"
    size="lg"
    :state="state">
    <div class="explore-scalar-panel bg-b-1 text-c-1 relative flex flex-col">
      <!-- Hero: lavender glow with the stickers as decoration -->
      <div
        class="explore-scalar-hero relative flex h-[200px] items-end justify-center overflow-hidden pb-6">
        <ExploreScalarStickers layout="hero" />
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
          <span
            class="bg-b-2 text-c-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ScalarIconPackage
              class="size-4"
              weight="bold" />
          </span>
          <span class="flex flex-col gap-0.5">
            <span class="text-c-1 text-base font-bold">
              {{ translate('exploreScalar.generateTitle') }}
            </span>
            <span class="text-c-2 text-sm">
              {{ translate('exploreScalar.generateDescription') }}
            </span>
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span
            class="bg-b-2 text-c-1 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ScalarIconGlobe
              class="size-4"
              weight="bold" />
          </span>
          <span class="flex flex-col gap-0.5">
            <span class="text-c-1 text-base font-bold">
              {{ translate('exploreScalar.platformTitle') }}
            </span>
            <span class="text-c-2 text-sm">
              {{ translate('exploreScalar.platformDescription') }}
            </span>
          </span>
        </li>
      </ul>

      <!-- Sign-up comes first in the DOM so the dialog's initial focus lands on the primary action -->
      <div class="flex flex-col gap-2 px-8 pt-1 pb-8">
        <!-- The spinner hides the label, so the name is pinned while loading (the button is still announced as busy) -->
        <ScalarButton
          :aria-busy="loader.isLoading"
          :aria-label="
            loader.isActive ? translate('exploreScalar.signUp') : undefined
          "
          class="h-10 w-full rounded-full text-base"
          :href="signUpHref"
          :is="signUpHref ? 'a' : 'button'"
          :loader="loader"
          :rel="signUpHref ? 'noopener noreferrer' : undefined"
          :target="signUpHref ? '_blank' : undefined"
          variant="solid"
          @click="onSignUp">
          <span class="flex items-center gap-1">
            {{ translate('exploreScalar.signUp') }}
            <ScalarIconArrowUpRight
              class="size-3.5"
              weight="bold" />
            <span class="sr-only">
              {{ translate('exploreScalar.opensInNewTab') }}
            </span>
          </span>
        </ScalarButton>
        <ScalarButton
          class="h-10 w-full rounded-full text-base"
          :href="DEMO_CALL_URL"
          :icon="ScalarIconCalendar"
          is="a"
          rel="noopener noreferrer"
          target="_blank"
          variant="outlined">
          {{ translate('exploreScalar.bookDemo') }}
          <span class="sr-only">
            {{ translate('exploreScalar.opensInNewTab') }}
          </span>
        </ScalarButton>
      </div>

      <!-- Close: last in the Tab order, at the inline end so RTL keeps it in the corner -->
      <ScalarIconButton
        class="text-c-2 hover:bg-b-2 hover:text-c-1 absolute end-3 top-3 rounded-full"
        :icon="ScalarIconX"
        :label="translate('exploreScalar.close')"
        size="sm"
        @click="state.hide()" />
    </div>
  </ScalarModal>
</template>

<!-- The dialog is portaled to <body>, outside this component's scope, so these rules are global and prefixed by the Dialog root class -->
<style>
.explore-scalar-modal .scalar-modal {
  border-radius: var(--scalar-radius-3xl);
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

/* The glow reaches transparent at 72% of the hero, so the title below sits on plain background */
.explore-scalar-hero {
  background:
    radial-gradient(
      120% 95% at 50% 0%,
      rgb(82 3 209 / 0.2) 0%,
      rgb(0 130 208 / 0.09) 42%,
      transparent 72%
    ),
    var(--scalar-background-1);
}
.dark-mode .explore-scalar-hero {
  background:
    radial-gradient(
      120% 95% at 50% 0%,
      rgb(82 3 209 / 0.38) 0%,
      rgb(0 130 208 / 0.14) 42%,
      transparent 72%
    ),
    var(--scalar-background-1);
}
.explore-scalar-hero .explore-scalar-sticker {
  filter: drop-shadow(0 6px 14px rgb(0 0 0 / 0.18));
}
.dark-mode .explore-scalar-hero .explore-scalar-sticker {
  filter: drop-shadow(0 6px 16px rgb(0 0 0 / 0.6));
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
    border-radius: var(--scalar-radius-xl);
  }
  to {
    border-radius: var(--scalar-radius-3xl);
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
