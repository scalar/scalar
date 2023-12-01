<!-- eslint-disable vue/no-unused-properties -->
<script setup lang="ts">
import { getTagSectionId } from '../../helpers'
import { type Spec, type Tag } from '../../types'
import { Anchor } from '../Anchor'
import { SectionHeader } from '../Section'
import SectionContainerAccordion from '../Section/SectionContainerAccordion.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

defineProps<{
  tag: Tag
  spec: Spec
  isFirst?: boolean
}>()
</script>
<template>
  <SectionContainerAccordion class="tag-section">
    <template #title>
      <SectionHeader
        class="tag-name"
        :level="2">
        <Anchor :id="getTagSectionId(tag)">
          {{ tag.name }}
        </Anchor>
      </SectionHeader>
      <MarkdownRenderer
        class="tag-description"
        :value="tag.description" />
    </template>
    <slot />
  </SectionContainerAccordion>
</template>
<style scoped>
.tag-section + .tag-section {
  margin-top: 20px;
}
.tag-name {
  text-transform: capitalize;
}
.tag-description {
  margin-top: -12px;
}
</style>
