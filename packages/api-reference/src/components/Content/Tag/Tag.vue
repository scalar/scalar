<script setup lang="ts">
import type { Spec, Tag } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { SectionContainer } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import Endpoints from './Endpoints.vue'

const props = defineProps<{
  id?: string
  tag: Tag
  spec: Spec
}>()

const sectionContainerRef = ref<HTMLElement | null>(null)

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()

const moreThanOneDefaultTag = computed(
  () =>
    props.spec.tags?.length !== 1 ||
    props.tag?.name !== 'default' ||
    props.tag?.description !== '',
)
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
      v-if="!collapsedSidebarItems[getTagId(tag)] && tag.operations?.length > 1"
      :id="id ?? ''" />
    <template v-else>
      <slot />
    </template>
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
