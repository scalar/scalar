<script setup lang="ts">
import { useNavState, useSidebar } from '../../hooks'
import { type Spec, type Tag } from '../../types'
import SectionContainer from '../Section/SectionContainer.vue'
import EndpointsOverview from './EndpointsOverview.vue'
import ShowMoreButton from './ShowMoreButton.vue'

const props = defineProps<{
  tag: Tag
  spec: Spec
  isFirst?: boolean
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
    <EndpointsOverview
      v-if="moreThanOneDefaultTag(tag)"
      :isLazy="!isFirst"
      :tag="tag" />
    <ShowMoreButton
      v-if="
        !isFirst &&
        !collapsedSidebarItems[getTagId(tag)] &&
        tag.operations?.length > 1
      "
      :id="getTagId(tag)" />
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
