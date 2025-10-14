<script setup lang="ts">
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed, nextTick, ref, useId } from 'vue'

import { Lazy } from '@/components/Lazy'
import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useNavState } from '@/hooks/useNavState'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'

import TagSection from './TagSection.vue'

const { tag, moreThanOneTag } = defineProps<{
  tag: TraversedTag
  moreThanOneTag: boolean
  isLoading: boolean
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const { collapsedSidebarItems, setCollapsedSidebarItem } = useSidebar()
const { hash } = useNavState()

const moreThanOneDefaultTag = computed(
  () => moreThanOneTag || tag?.title !== 'default' || tag?.description !== '',
)

async function focusContents() {
  setCollapsedSidebarItem(tag.id, true)
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
        :isLoading="isLoading"
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
