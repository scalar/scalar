<script lang="ts" setup>
/**
 * The card frame the localhost shell's side panel uses for Share and Deploy, matching the Generate
 * SDK card: the brand wash across the top, a hero, a centred title, a divider, the content, and the
 * close circle in the corner (last in the Tab order).
 */
import { ScalarIconX } from '@scalar/icons'
import { useId } from 'vue'

import { useLocalization } from '@/features/localization'

const {
  title,
  description,
  divided = true,
} = defineProps<{
  title: string
  description?: string
  /** A divider between the heading and the content; Deploy goes straight into its sign-up */
  divided?: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

defineSlots<{
  /** Artwork above the title, sitting on the wash */
  hero?(): unknown
  /** The card's content; `titleId` names a form after the card */
  default?(props: { titleId: string }): unknown
}>()

const { translate } = useLocalization()
const titleId = useId()
</script>
<template>
  <div class="developer-tools-card bg-b-1 text-c-1 relative flex flex-col">
    <div
      class="relative flex h-[200px] shrink-0 items-end justify-center overflow-hidden pb-6">
      <span
        aria-hidden="true"
        class="developer-tools-card-wash pointer-events-none absolute inset-x-0 top-0" />
      <!-- The artwork's own tilt stays on the artwork, so the entrance only has to scale and lift this wrapper -->
      <span class="developer-tools-card-hero flex origin-bottom">
        <slot name="hero" />
      </span>
    </div>

    <div class="flex flex-col gap-2 px-8 pt-2 text-center">
      <h2
        :id="titleId"
        class="text-c-1 m-0 text-xl leading-snug font-bold tracking-tight text-balance">
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-c-2 m-0 text-sm leading-relaxed text-balance">
        {{ description }}
      </p>
    </div>

    <hr
      v-if="divided"
      class="border-border mx-8 mt-5 border-0 border-t" />

    <div class="px-8 pt-5 pb-6">
      <slot :titleId />
    </div>

    <button
      :aria-label="translate('exploreScalar.close')"
      class="bg-b-1/70 text-c-2 hover:bg-b-2 hover:text-c-1 ring-border absolute end-3 top-3 z-10 flex size-8 items-center justify-center rounded-full shadow-sm ring-1"
      type="button"
      @click="emit('close')">
      <ScalarIconX class="size-4" />
    </button>
  </div>
</template>
<style scoped>
/* The same brand gradient wash as the Generate SDK card's hero */
.developer-tools-card-wash {
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

/* The artwork pops in like the Generate SDK card's stickers, each time a card opens */
.developer-tools-card-hero {
  animation: developer-tools-card-pop 360ms cubic-bezier(0.34, 1.3, 0.4, 1) both;
}
@keyframes developer-tools-card-pop {
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
  .developer-tools-card-hero {
    animation: none;
  }
}
</style>
