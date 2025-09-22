<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { TraversedTag } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { Anchor } from '@/components/Anchor'
import {
  SectionContainerAccordion,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

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
