<script setup lang="ts">
import { getTagSectionId } from '../../helpers'
import { useNavigation } from '../../hooks'
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
  <SectionContainer>
    <EndpointsOverview
      v-if="moreThanOneDefaultTag(tag)"
      :tag="tag" />
    <ShowMoreButton
      v-if="
        !isFirst &&
        !collapsedSidebarItems[getTagSectionId(tag)] &&
        tag.operations?.length > 1
      "
      :id="getTagSectionId(tag)" />
    <template v-else>
      <slot />
    </template>
  </SectionContainer>
</template>
