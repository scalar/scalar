<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
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
  eventBus: WorkspaceEventBus | null
}>()
</script>

<template>
  <SectionContainerAccordion
    :aria-label="tag.title"
    class="tag-section"
    :class="{ 'tag-section-group': tag.isGroup }"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) => eventBus?.emit('toggle:nav-item', { id: tag.id, open: value })
    ">
    <template #title>
      <SectionHeader
        class="tag-name"
        :class="{ 'tag-group-name': tag.isGroup }">
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: tag.id })
          ">
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

/* Tag Groups */
.tag-section-group .tag-group-name {
  gap: 12px;
  align-self: stretch;
  grid-template-columns: auto 1fr;
}
.tag-group-name:after {
  content: '';
  display: block;
  height: 1px;
  align-self: center;
  background: var(--scalar-border-color);
}
.tag-group-name:has(* > *:hover),
.tag-group-name:has(:focus-visible) {
  gap: 32px;
}
.tag-section-group .tag-section {
  padding-inline: 0;
  margin-bottom: 24px;
}
.tag-section-group .tag-section:last-of-type {
  margin-bottom: 0;
}
</style>
