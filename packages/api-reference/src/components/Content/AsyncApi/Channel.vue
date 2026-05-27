<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiChannelObject,
  AsyncApiDocument,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedAsyncApiChannel } from '@scalar/workspace-store/schemas/navigation'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import {
  Section,
  SectionContainer,
  SectionContainerAccordion,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

const { channel, document, layout, isCollapsed, eventBus } = defineProps<{
  channel: TraversedAsyncApiChannel
  document: AsyncApiDocument
  layout: 'classic' | 'modern'
  isCollapsed: boolean
  eventBus: WorkspaceEventBus | null
}>()

const headerId = useId()

/**
 * Resolve the channel from the document so we can read its description.
 * The navigation entry only carries the address and identifying keys.
 */
const resolvedChannel = computed<AsyncApiChannelObject | undefined>(() => {
  const node = document.channels?.[channel.channelName]
  return node ? getResolvedRef(node, mergeSiblingReferences) : undefined
})

const description = computed(() => resolvedChannel.value?.description ?? '')
</script>

<template>
  <SectionContainerAccordion
    v-if="layout === 'classic'"
    :aria-label="channel.channelAddress"
    class="channel-section"
    :modelValue="!isCollapsed"
    @update:modelValue="
      (value) =>
        eventBus?.emit('toggle:nav-item', { id: channel.id, open: value })
    ">
    <template #title>
      <SectionHeader class="channel-name">
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: channel.id })
          ">
          <SectionHeaderTag :level="2">
            {{ channel.channelAddress }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <ScalarMarkdown
        class="channel-description"
        :value="description"
        withImages />
    </template>
  </SectionContainerAccordion>

  <SectionContainer
    v-else
    :aria-labelledby="headerId"
    role="region">
    <Section
      :id="channel.id"
      role="none"
      @intersecting="
        () => eventBus?.emit('intersecting:nav-item', { id: channel.id })
      ">
      <SectionHeader>
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: channel.id })
          ">
          <SectionHeaderTag
            :id="headerId"
            :level="2">
            {{ channel.channelAddress }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <SectionContent>
        <ScalarMarkdown
          :value="description"
          withImages />
      </SectionContent>
    </Section>
  </SectionContainer>
</template>

<style scoped>
.channel-section {
  margin-bottom: 48px;
}
.channel-description {
  padding-bottom: 4px;
  text-align: left;
}
</style>
