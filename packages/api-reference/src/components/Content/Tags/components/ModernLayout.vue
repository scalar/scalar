<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
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
  eventBus: WorkspaceEventBus | null
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
        :eventBus="eventBus"
        :headerId="headerId"
        :isCollapsed="isCollapsed"
        :isLoading="isLoading"
        :tag="tag" />
      <ShowMoreButton
        v-if="isCollapsed && moreThanOneTag"
        :id="tag.id"
        :aria-label="`Show all ${tag.title} endpoints`"
        @click="
          () => eventBus?.emit('toggle:nav-item', { id: tag.id, open: true })
        " />
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
