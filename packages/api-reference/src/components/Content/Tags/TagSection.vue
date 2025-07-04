<script setup lang="ts">
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Spec } from '@scalar/types/legacy'
import { computed, nextTick, ref, useId } from 'vue'

import { SectionContainer } from '@/components/Section'
import ShowMoreButton from '@/components/ShowMoreButton.vue'
import { useSidebar } from '@/features/sidebar'
import type { TraversedTag } from '@/features/traverse-schema'
import { useNavState } from '@/hooks/useNavState'

import Tag from './Tag.vue'

const props = defineProps<{
  id?: string
  tag: TraversedTag
  collection: Collection
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()
const tagId = computed(() => props.id || getTagId(props.tag) || '')

const moreThanOneTag = computed(
  () => true,
  // TODO:
  // () => props.spec.tags?.length && props.spec.tags?.length > 1,
)

const moreThanOneDefaultTag = computed(
  () =>
    moreThanOneTag.value ||
    props.tag?.title !== 'default' ||
    props.tag?.tag.description !== '',
)

async function focusContents() {
  await nextTick()
  contentsRef.value?.querySelector('button')?.focus()
}
</script>

<template>
  <SectionContainer
    ref="sectionContainerRef"
    :aria-labelledby="headerId"
    class="tag-section-container"
    role="region">
    <Tag
      v-if="moreThanOneDefaultTag"
      :id="id"
      :collection="collection"
      :headerId="headerId"
      :isCollapsed="!collapsedSidebarItems[tagId]"
      :tag="tag" />
    <ShowMoreButton
      v-if="!collapsedSidebarItems[tagId] && moreThanOneTag"
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
