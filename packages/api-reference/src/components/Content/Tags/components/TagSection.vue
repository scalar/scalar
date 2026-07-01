<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import ChannelsList from '@/components/Content/AsyncApi/ChannelsList.vue'
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
import { useLocalization } from '@/features/localization'
import { SpecificationExtension } from '@/features/specification-extension'

const { tag, headerId, isCollapsed } = defineProps<{
  tag: TraversedTag
  headerId?: string
  isCollapsed?: boolean
  eventBus: WorkspaceEventBus | null
}>()
const { translate } = useLocalization()

/**
 * AsyncAPI tags carry `asyncapi-channel` children instead of `operation`/`webhook`,
 * so they get a dedicated channel list rather than the (empty) operations card.
 */
const hasChannels = computed(
  () =>
    tag.children?.some((child) => child.type === 'asyncapi-channel') ?? false,
)
</script>
<template>
  <Section
    v-if="tag"
    :id="tag.id"
    role="none"
    @intersecting="
      () => eventBus?.emit('intersecting:nav-item', { id: tag.id })
    ">
    <SectionHeader>
      <Anchor
        @copyAnchorUrl="
          () => eventBus?.emit('copy-url:nav-item', { id: tag.id })
        ">
        <SectionHeaderTag
          :id="headerId"
          :level="2">
          {{ tag.title }}
          <ScreenReader v-if="isCollapsed">
            ({{ translate('navigation.collapsed') }})
          </ScreenReader>
        </SectionHeaderTag>
      </Anchor>
    </SectionHeader>
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <ScalarMarkdown
            :clamp="isCollapsed ? 7 : undefined"
            :value="tag?.description ?? ''"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <ChannelsList
            v-if="hasChannels"
            :eventBus="eventBus"
            :tag="tag" />
          <OperationsList
            v-else
            :eventBus="eventBus"
            :tag="tag" />
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
    <SpecificationExtension :value="tag.xKeys" />
  </Section>
</template>
