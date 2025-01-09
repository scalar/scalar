<script setup lang="ts">
import type { Spec, Tag } from '@scalar/types/legacy'
import { computed, nextTick, ref } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { SectionContainer } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import Endpoints from './Endpoints.vue'

const props = defineProps<{
  id?: string
  tag: Tag
  spec: Spec
}>()

const sectionContainerRef = ref<HTMLElement>()
const contentsRef = ref<HTMLElement>()

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
    class="tag-section-container">
    <Endpoints
      v-if="moreThanOneDefaultTag"
      :id="id"
      :isCollapsed="!collapsedSidebarItems[getTagId(tag)]"
      :tag="tag" />
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
