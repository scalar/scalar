<script setup lang="ts">
import { useNavState, useSidebar } from '../../../hooks'
import type { Spec, Tag } from '../../../types'
import { SectionContainer } from '../../Section'
import ShowMoreButton from '../../ShowMoreButton.vue'
import Endpoints from './Endpoints.vue'

const props = defineProps<{
  id?: string
  tag: Tag
  spec: Spec
}>()

const { collapsedSidebarItems } = useSidebar()
const { getTagId } = useNavState()

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''
</script>
<template>
  <SectionContainer class="tag-section-container">
    <Endpoints
      v-if="moreThanOneDefaultTag(tag)"
      :id="id"
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
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
