<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'

import { Anchor } from '@/components/Anchor'
import { OperationsList } from '@/components/OperationsList'
import ScreenReader from '@/components/ScreenReader.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { SpecificationExtension } from '@/features/specification-extension'

const { tag, headerId, isCollapsed } = defineProps<{
  tag: TraversedTag
  headerId?: string
  isCollapsed?: boolean
  isLoading?: boolean
  eventBus: WorkspaceEventBus | null
}>()
</script>
<template>
  <Section
    v-if="tag"
    :id="tag.id"
    role="none"
    @intersecting="
      () => eventBus?.emit('intersecting:nav-item', { id: tag.id })
    ">
    <SectionHeader v-show="!isLoading">
      <Anchor
        @copyAnchorUrl="
          () => eventBus?.emit('copy-url:nav-item', { id: tag.id })
        ">
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          {{ tag.title }}
          <ScreenReader v-if="isCollapsed"> (Collapsed)</ScreenReader>
        </SectionHeaderTag>
      </Anchor>
    </SectionHeader>
    <SectionContent :loading="isLoading">
      <SectionColumns>
        <SectionColumn>
          <ScalarMarkdown
            :clamp="isCollapsed ? 7 : undefined"
            :value="tag?.description ?? ''"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <OperationsList
            :eventBus="eventBus"
            :tag="tag" />
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
    <SpecificationExtension :value="tag.xKeys" />
  </Section>
</template>
