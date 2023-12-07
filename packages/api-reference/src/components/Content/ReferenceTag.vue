<script setup lang="ts">
import { getTagHash, useNavigation } from '../../hooks'
import { type Spec, type Tag } from '../../types'
import SectionContainer from '../Section/SectionContainer.vue'
import EndpointsOverview from './EndpointsOverview.vue'
import ShowMoreButton from './ShowMoreButton.vue'

const props = defineProps<{
  tag: Tag
  spec: Spec
  isFirst?: boolean
}>()

const { collapsedSidebarItems } = useNavigation()

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''
</script>
<template>
  <SectionContainer class="tag-section-container">
    <EndpointsOverview
      v-if="moreThanOneDefaultTag(tag)"
      :tag="tag" />
    <ShowMoreButton
      v-if="
        !isFirst &&
        !collapsedSidebarItems[getTagHash(tag)] &&
        tag.operations?.length > 1
      "
      :id="getTagHash(tag)" />
    <template v-else>
      <slot />
    </template>
  </SectionContainer>
</template>
<style scoped>
.tag-section-container {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
