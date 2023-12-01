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
<style scoped>
.show-more {
  background: var(--theme-background-1, var(--default-theme-background-1));
  appearance: none;
  border: none;
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: auto;
  padding: 8px 12px;
  border-radius: 30px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-small, var(--default-theme-small));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -48px;
  margin-bottom: 48px;
  position: relative;
}
.show-more:hover {
  color: var(--theme-color-2, var(--default-theme-color-2));
  cursor: pointer;
}
.show-more-icon {
  width: 14px;
  height: 14px;
  margin-left: 3px;
}
.show-more:active {
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}
.references-narrow .show-more {
  margin-top: -25px;
  margin-bottom: 25px;
}
@media (max-width: 1165px) {
  .show-more {
    margin-top: -24px;
    margin-bottom: 24px;
  }
}
</style>
