<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'

import { Lazy } from '@/components/Lazy'
import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useSidebar } from '@/features/sidebar'
import type { TraversedTag } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import TagSection from './TagSection.vue'

const { tag, moreThanOneTag } = defineProps<{
  tag: TraversedTag
  moreThanOneTag: boolean
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const { collapsedSidebarItems } = useSidebar()
const { hash } = useNavState()

const moreThanOneDefaultTag = computed(
  () =>
    moreThanOneTag || tag?.title !== 'default' || tag?.tag.description !== '',
)

async function focusContents() {
  await nextTick()
  contentsRef.value?.querySelector('button')?.focus()
}

const isCollapsed = (tagId: string) => {
  return !collapsedSidebarItems[tagId]
}
</script>

<template>
  <SectionContainer
    ref="sectionContainerRef"
    :aria-labelledby="headerId"
    class="tag-section-container"
    role="region">
    <!-- Lazy load this part -->
    <Lazy
      :id="`modern-tag-${tag.id}`"
      :isLazy="Boolean(hash) && hash !== tag.id && hash.startsWith(tag.id)">
      <TagSection
        v-if="moreThanOneDefaultTag"
        :headerId="headerId"
        :isCollapsed="isCollapsed(tag.id)"
        :tag="tag" />
      <ShowMoreButton
        v-if="isCollapsed(tag.id) && moreThanOneTag"
        :id="tag.id"
        :aria-label="`Show all ${tag.title} endpoints`"
        @click="focusContents" />
    </Lazy>

    <!-- We cannot use v-else due to the Lazy wrapper, but its the opposite of above -->
    <div
      v-if="!(isCollapsed(tag.id) && moreThanOneTag)"
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
