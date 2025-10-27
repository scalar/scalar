<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import { Anchor } from '@/components/Anchor'
import {
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

const { tag, isCollapsed } = defineProps<{
  tag: TraversedTag
  isCollapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'copyAnchorUrl', id: string): void
}>()
</script>

<template>
  <SectionContainerAccordion
    class="tag-section"
    :modelValue="!isCollapsed"
    @update:modelValue="(value) => emit('toggleTag', tag.id, value)">
    <template #title>
      <SectionHeader class="tag-name">
        <Anchor @copyAnchorUrl="() => emit('copyAnchorUrl', tag.id)">
          <SectionHeaderTag :level="2">
            {{ tag.title }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <ScalarMarkdown
        class="tag-description"
        :value="tag?.description"
        withImages />
    </template>
    <slot />
  </SectionContainerAccordion>
</template>

<style scoped>
.tag-section {
  margin-bottom: 48px;
}
.tag-name {
  text-transform: capitalize;
}
.tag-description {
  padding-bottom: 4px;
  text-align: left;
}
</style>
