<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'

import { Anchor } from '@/components/Anchor'
import {
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import type { TraversedTag } from '@/features/traverse-schema'

defineProps<{
  tag: TraversedTag
}>()
</script>

<template>
  <SectionContainerAccordion class="tag-section">
    <template #title>
      <SectionHeader class="tag-name">
        <Anchor :id="tag.id">
          <SectionHeaderTag :level="2">
            {{ tag.title }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <ScalarMarkdown
        class="tag-description"
        :value="tag.tag?.description"
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
