<script setup lang="ts">
import { computed } from 'vue'

import StickerAgentScalar from './stickers/StickerAgentScalar.vue'
import StickerDeveloperPortals from './stickers/StickerDeveloperPortals.vue'
import StickerSdks from './stickers/StickerSdks.vue'

const { layout } = defineProps<{
  /** `row` is the fan inside the sidebar card, `hero` the pile at the top of the dialog */
  layout: 'row' | 'hero'
}>()

type StickerLayout = {
  wrapper: string
  portals: string
  sdks: string
  agent: string
  rotate: { portals: string; sdks: string; agent: string }
}

const LAYOUTS: Record<'row' | 'hero', StickerLayout> = {
  row: {
    wrapper: 'flex items-end justify-center gap-2 px-3 pt-4',
    portals: 'w-[52px] origin-bottom',
    sdks: 'w-[56px] origin-bottom',
    agent: 'w-[50px] origin-bottom',
    rotate: { portals: '-6deg', sdks: '2deg', agent: '6deg' },
  },
  hero: {
    // Side padding leaves room for the rotated corners; min-w-0 on the pile and the stickers lets
    // everything shrink on narrow screens instead of clipping at the panel edges.
    wrapper: 'relative flex min-w-0 items-end justify-center px-4',
    // Negative margins tuck the outer two behind the SDKs triangle, like a pile of stickers.
    portals: 'relative z-0 w-[92px] min-w-0 origin-bottom translate-y-1',
    sdks: 'relative z-10 -mx-3 w-[120px] min-w-0 origin-bottom',
    agent: 'relative z-0 w-[104px] min-w-0 origin-bottom translate-y-0.5',
    rotate: { portals: '-8deg', sdks: '2deg', agent: '6deg' },
  },
}

const classes = computed(() => LAYOUTS[layout])
</script>

<template>
  <!-- A span, because both variants are decorative phrasing content: the row sits inside the card next to the trigger, the hero inside the dialog heading area -->
  <span
    aria-hidden="true"
    class="explore-scalar-stickers"
    :class="classes.wrapper">
    <StickerDeveloperPortals
      :class="classes.portals"
      :style="{ '--sticker-rotate': classes.rotate.portals }" />
    <StickerSdks
      :class="classes.sdks"
      :style="{ '--sticker-rotate': classes.rotate.sdks }" />
    <StickerAgentScalar
      :class="classes.agent"
      :style="{ '--sticker-rotate': classes.rotate.agent }" />
  </span>
</template>

<style scoped>
/* Rotation lives in its own property so the entrance keyframes and view transitions can keep it */
.explore-scalar-stickers :deep(.explore-scalar-sticker) {
  rotate: var(--sticker-rotate, 0deg);
}
</style>
