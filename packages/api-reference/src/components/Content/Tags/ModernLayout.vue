<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'

import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useSidebar } from '@/features/sidebar'
import type { TraversedTag } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import TagSection from './TagSection.vue'

const { id, tag } = defineProps<{
  id: string
  tag: TraversedTag
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()
const tagId = computed(() => id || getTagId(tag) || '')

const moreThanOneTag = computed(
  () => true,
  // TODO:
  // () => spec.tags?.length && spec.tags?.length > 1,
)

const moreThanOneDefaultTag = computed(
  () =>
    moreThanOneTag.value ||
    tag?.title !== 'default' ||
    tag?.tag.description !== '',
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
    <TagSection
      v-if="moreThanOneDefaultTag"
      :id="id"
      :headerId="headerId"
      :isCollapsed="isCollapsed(tagId)"
      :tag="tag" />
    <ShowMoreButton
      v-if="isCollapsed(tagId) && moreThanOneTag"
      :id="tagId"
      :aria-label="`Show all ${tag.title} endpoints`"
      @click="focusContents" />
    <div
      v-else
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
