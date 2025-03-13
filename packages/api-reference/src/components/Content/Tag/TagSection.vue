<script setup lang="ts">
import type { Collection } from '@scalar/oas-utils/entities/spec'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed, nextTick, ref, useId } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { SectionContainer } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import Tag from './Tag.vue'

const props = defineProps<{
  id?: string
  tag: TagType
  collection: Collection
  spec: Spec
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

const headerId = useId()

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()

const moreThanOneTag = computed(
  () => props.spec.tags?.length && props.spec.tags?.length > 1,
)

const moreThanOneDefaultTag = computed(
  () =>
    moreThanOneTag.value ||
    props.tag?.name !== 'default' ||
    props.tag?.description !== '',
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
      :headerId="headerId"
      :isCollapsed="!collapsedSidebarItems[getTagId(tag)]"
      :tag="tag"
      :collection="collection" />
    <ShowMoreButton
      v-if="!collapsedSidebarItems[getTagId(tag)] && moreThanOneTag"
      :id="id ?? ''"
      :aria-label="`Show all ${tag['x-displayName'] ?? tag.name} endpoints`"
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
