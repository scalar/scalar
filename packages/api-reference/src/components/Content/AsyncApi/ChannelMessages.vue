<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedAsyncApiChannel,
  TraversedAsyncApiMessage,
} from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'

import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import { filterChildrenByType } from './helpers/filter-children-by-type'
import Message from './Message.vue'

const {
  channel,
  document,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<
  {
    channel: TraversedAsyncApiChannel
    document: AsyncApiDocument
    eventBus: WorkspaceEventBus | null
    options?: Partial<AsyncApiSchemaRenderOptions>
    expandedItems?: Record<string, boolean>
  } & SchemaRenderingProps
>()

const messages = computed<TraversedAsyncApiMessage[]>(() =>
  filterChildrenByType<TraversedAsyncApiMessage>(
    channel.children,
    'asyncapi-message',
  ),
)
const { level: headingLevel } = useDocumentOutline('channelMessages')
</script>

<template>
  <div
    v-if="messages.length"
    class="mt-8">
    <SectionHeaderTag :level="headingLevel">Channel messages</SectionHeaderTag>
    <p class="text-c-2 mt-1 mb-3 text-sm">
      All messages defined on this channel. Each operation lists the messages it
      supports.
    </p>
    <Message
      v-for="message in messages"
      :key="message.id"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :expansion="expansion"
      :message="message"
      :options="options"
      :scrollTargetId="scrollTargetId"
      :specificationExtension="specificationExtension" />
  </div>
</template>
