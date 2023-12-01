<script setup lang="ts">
import { getTagSectionId } from '../../helpers'
import { useNavigation } from '../../hooks'
import { type Spec, type Tag } from '../../types'
import { FlowIcon } from '../Icon'
import SectionContainer from '../Section/SectionContainer.vue'
import EndpointsOverview from './EndpointsOverview.vue'

const props = defineProps<{
  tag: Tag
  spec: Spec
  isFirst?: boolean
}>()

const { setCollapsedSidebarItem, collapsedSidebarItems } = useNavigation()

const moreThanOneDefaultTag = (tag: Tag) =>
  props.spec.tags?.length !== 1 ||
  tag?.name !== 'default' ||
  tag?.description !== ''
</script>
<template>
  <SectionContainer v-if="tag.operations && tag.operations.length > 0">
    <EndpointsOverview
      v-if="moreThanOneDefaultTag(tag)"
      :tag="tag" />
    <button
      v-if="
        !isFirst &&
        !collapsedSidebarItems[getTagSectionId(tag)] &&
        tag.operations?.length > 1
      "
      class="show-more"
      type="button"
      @click="setCollapsedSidebarItem(getTagSectionId(tag), true)">
      Show More
      <FlowIcon
        class="show-more-icon"
        icon="ChevronDown" />
    </button>
    <template v-else>
      <slot />
    </template>
  </SectionContainer>
</template>
