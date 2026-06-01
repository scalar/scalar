<script setup lang="ts">
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedAsyncApiChannel,
  TraversedEntry,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'

import { Tag } from '@/components/Content/Tags'
import Lazy from '@/components/Lazy/Lazy.vue'

import Channel from './Channel.vue'

const {
  entries,
  document,
  expandedItems,
  options,
  eventBus,
  level = 0,
} = defineProps<{
  entries: TraversedEntry[]
  document: AsyncApiDocument
  expandedItems: Record<string, boolean>
  options: { layout: 'classic' | 'modern' }
  eventBus: WorkspaceEventBus
  level?: number
}>()

const isTagGroup = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: true } =>
  entry.type === 'tag' && entry.isGroup === true
/**
 * Narrow to a regular (non-group) tag. Tag groups go through a separate branch
 * and must not inflate the sibling-tag count used for `moreThanOneTag`,
 * otherwise `ModernLayout` shows a "Show more" button for a lone tag whenever
 * it sits next to a tag group.
 */
const isTag = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: false } =>
  entry.type === 'tag' && !isTagGroup(entry)
const isChannel = (entry: TraversedEntry): entry is TraversedAsyncApiChannel =>
  entry.type === 'asyncapi-channel'
</script>

<template>
  <Lazy
    v-for="entry in entries"
    :id="entry.id"
    :key="`${entry.id}-${options.layout}`"
    :expanded="!!expandedItems[entry.id]">
    <Channel
      v-if="isChannel(entry)"
      :channel="entry"
      :document="document"
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout" />

    <Tag
      v-else-if="
        isTag(entry) || (isTagGroup(entry) && options.layout === 'classic')
      "
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :isLoading="false"
      :layout="options.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :tag="entry">
      <template v-if="entry.children?.length">
        <AsyncApiTraversedEntry
          :document="document"
          :entries="entry.children"
          :eventBus="eventBus"
          :expandedItems="expandedItems"
          :level="level + 1"
          :options="options" />
      </template>
    </Tag>

    <AsyncApiTraversedEntry
      v-else-if="isTagGroup(entry)"
      :document="document"
      :entries="entry.children ?? []"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :level="level + 1"
      :options="options" />
  </Lazy>
</template>
