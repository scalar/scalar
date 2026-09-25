<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedTag } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
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
import type { HeadingLevel } from '@/features/document-outline'
import { EditableDescription } from '@/features/editable-description'
import { useLocalization } from '@/features/localization'
import { SpecificationExtension } from '@/features/specification-extension'

const {
  tag,
  headerId,
  isCollapsed,
  headingLevel = 1,
  document,
} = defineProps<{
  tag: TraversedTag
  /** The document the tag belongs to, so its description can be edited in place */
  document?: OpenApiDocument
  /**
   * Resolved by the parent, which owns this tag and the operations beside it.
   * Defaults to the top of the page, like any other block rendered on its own.
   */
  headingLevel?: HeadingLevel
  headerId?: string
  isCollapsed?: boolean
  eventBus: WorkspaceEventBus | null
}>()
const { translate } = useLocalization()

/** The tag object in the document: the navigation entry is a copy, and edits have to land on the original. */
const tagObject = computed(() =>
  document?.tags?.find((candidate) => candidate.name === tag.name),
)

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
          :level="headingLevel">
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
          <EditableDescription
            :clamp="isCollapsed ? 7 : undefined"
            :target="tagObject"
            :value="tagObject?.description ?? tag?.description ?? ''"
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
