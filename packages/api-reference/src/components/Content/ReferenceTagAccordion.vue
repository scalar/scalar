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
  <SectionContainerAccordion>
    <template #title>
      <SectionHeader :level="2">
        <Anchor :id="getTagSectionId(tag)">
          {{ tag.name }}
        </Anchor>
      </SectionHeader>
      <MarkdownRenderer :value="tag.description" />
    </template>
    <slot />
  </SectionContainerAccordion>
</template>
<style scoped></style>
