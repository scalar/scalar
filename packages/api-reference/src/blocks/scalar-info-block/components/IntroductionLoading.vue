<script setup lang="ts">
/**
 * Loading skeleton for the introduction block. It mirrors the real layout
 * (badges, title, links, description and selector cards) so the page does not
 * jump once the document has loaded.
 */
import { SectionColumn, SectionColumns } from '@/components/Section'

const { hasAside = true } = defineProps<{
  /**
   * Whether the selector cards live in a sticky aside column (modern layout)
   * or in a row below the description (classic layout). Mirrors the
   * `$slots.aside` check in the loaded layout.
   */
  hasAside?: boolean
}>()
</script>

<template>
  <div
    class="introduction-loading flex flex-col gap-5"
    aria-hidden="true">
    <!-- Version and specification badges -->
    <div class="flex gap-1.5">
      <div class="introduction-skeleton h-6 w-14 rounded-full" />
      <div class="introduction-skeleton h-6 w-24 rounded-full" />
    </div>
    <!-- Title and links (mirrors SectionHeader's two-column grid at xl) -->
    <div class="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:gap-12">
      <div class="introduction-skeleton h-9 w-3/5 rounded-lg" />
      <div class="flex flex-wrap items-center gap-2 xl:justify-end">
        <div class="introduction-skeleton h-5 w-28 rounded" />
        <div class="introduction-skeleton h-5 w-28 rounded" />
        <div class="introduction-skeleton h-5 w-12 rounded" />
      </div>
    </div>
    <SectionColumns>
      <SectionColumn>
        <div class="flex flex-col gap-3">
          <!-- Download link -->
          <div class="introduction-skeleton mb-2 h-5 w-56 rounded" />
          <!-- Description -->
          <div class="introduction-skeleton h-4 w-full rounded" />
          <div class="introduction-skeleton h-4 w-11/12 rounded" />
          <div class="introduction-skeleton h-4 w-4/5 rounded" />
          <!-- Section heading -->
          <div class="introduction-skeleton mt-4 h-6 w-40 rounded" />
          <div class="introduction-skeleton h-4 w-3/4 rounded" />
          <div class="introduction-skeleton h-4 w-2/3 rounded" />
          <div class="introduction-skeleton h-4 w-1/2 rounded" />
        </div>
      </SectionColumn>
      <!-- Modern layout: selector cards in a sticky aside column -->
      <SectionColumn v-if="hasAside">
        <div class="sticky-cards gap-3">
          <div class="introduction-skeleton h-20 w-full rounded-lg" />
          <div class="introduction-skeleton h-28 w-full rounded-lg" />
          <div class="introduction-skeleton h-28 w-full rounded-lg" />
        </div>
      </SectionColumn>
    </SectionColumns>
    <!-- Classic layout: selector cards in a row below the description -->
    <div
      v-if="!hasAside"
      class="flex flex-col gap-3 sm:flex-row sm:gap-6">
      <div class="introduction-skeleton h-28 w-full flex-1 rounded-lg" />
      <div class="introduction-skeleton h-28 w-full flex-1 rounded-lg" />
      <div class="introduction-skeleton h-28 w-full flex-1 rounded-lg" />
    </div>
  </div>
</template>

<style scoped>
.sticky-cards {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: calc(var(--refs-viewport-offset) + 24px);
}

/* Pulsing placeholder, matching the look of the rest of the loading states. */
.introduction-skeleton {
  background: var(--scalar-background-3);
  animation: introduction-skeleton-pulse 1.5s infinite alternate;
}

@keyframes introduction-skeleton-pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.33;
  }
}
</style>
