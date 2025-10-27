<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, useId } from 'vue'

import Lazy from '@/components/Lazy/Lazy.vue'
import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'

import TagSection from './TagSection.vue'

const { tag, moreThanOneTag } = defineProps<{
  tag: TraversedTag
  moreThanOneTag: boolean
  isLoading: boolean
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'scrollToId', id: string): void
  (e: 'copyAnchorUrl', id: string): void
  (e: 'intersecting', id: string): void
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const moreThanOneDefaultTag = computed(
  () => moreThanOneTag || tag?.title !== 'default' || tag?.description !== '',
)
</script>

<template>
  <SectionContainer
    ref="sectionContainerRef"
    :aria-labelledby="headerId"
    class="tag-section-container"
    role="region">
    <!-- Lazy load this part -->
    <Lazy :id="tag.id">
      <TagSection
        v-if="moreThanOneDefaultTag"
        :headerId="headerId"
        :isCollapsed="isCollapsed"
        :isLoading="isLoading"
        :tag="tag"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
        @intersecting="(id) => emit('intersecting', id)"
        @scrollToId="(id) => emit('scrollToId', id)" />
      <ShowMoreButton
        v-if="isCollapsed && moreThanOneTag"
        :id="tag.id"
        :aria-label="`Show all ${tag.title} endpoints`"
        @click="() => emit('toggleTag', tag.id, true)" />
    </Lazy>

    <!-- We cannot use v-else due to the Lazy wrapper, but its the opposite of above -->
    <div
      v-if="!(isCollapsed && moreThanOneTag)"
      ref="contentsRef"
      class="contents">
      <slot />
    </div>
  </SectionContainer>
</template>

<style scoped>
.section-container {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}
.section-container:has(.show-more) {
  background-color: color-mix(in srgb, var(--scalar-background-2), transparent);
}
</style>
