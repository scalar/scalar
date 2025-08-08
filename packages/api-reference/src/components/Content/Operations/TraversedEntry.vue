<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import { Tag } from '@/components/Content/Tags'
import { Lazy } from '@/components/Lazy'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import {
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import type { TraversedWebhook } from '@/features/traverse-schema/types'
import { useNavState } from '@/hooks/useNavState'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

const {
  level = 0,
  entries,
  rootIndex,
} = defineProps<{
  level?: number
  rootIndex: number
  entries: TraversedEntry[]
  config: ApiReferenceConfiguration
  document: OpenApiDocument
  clientOptions: ClientOptionGroup[]
  activeCollection: Collection
  activeServer: Server | undefined
  store: WorkspaceStore
}>()

/**
 * Type guards for different entry types
 */
const isTagGroup = (entry: TraversedEntry): entry is TraversedTag =>
  'isGroup' in entry && entry.isGroup

const isTag = (entry: TraversedEntry): entry is TraversedTag =>
  'tag' in entry && !isTagGroup(entry)

const isOperation = (entry: TraversedEntry): entry is TraversedOperation =>
  'operation' in entry

const isWebhook = (entry: TraversedEntry): entry is TraversedWebhook =>
  'webhook' in entry

const isWebhookGroup = (entry: TraversedEntry): entry is TraversedTag =>
  'isWebhooks' in entry && Boolean(entry.isWebhooks)

const isRootLevel = computed(() => level === 0)
const { hash } = useNavState()

/** The index of the current entry */
const currentIndex = computed(() => {
  if (isRootLevel.value) {
    return rootIndex
  }

  return getCurrentIndex(hash.value, entries)
})

/**
 * Check if the entry should be lazy loaded
 * We care more about the previous entries so we track those
 */
const isLazy = (entry: TraversedEntry, index: number) => {
  // Don't be lazy if we are a tag group
  if (isTagGroup(entry)) {
    return null
  }

  // Make all previous entries lazy
  if (index < currentIndex.value) {
    return 'prev'
  }

  // We make the next two siblings not lazy
  if (index > currentIndex.value + 2) {
    return 'after'
  }

  return null
}

defineExpose({
  currentIndex,
})
</script>

<template>
  <Lazy
    v-for="(entry, index) in entries"
    :key="entry.id"
    :id="entry.id"
    :prev="isLazy(entry, index) === 'prev'"
    :isLazy="Boolean(isLazy(entry, index))">
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <!-- Operation or Webhook -->
      <SectionContainer :omit="!isRootLevel">
        <Operation
          :path="isWebhook(entry) ? entry.name : entry.path"
          :method="entry.method"
          :id="entry.id"
          :collection="activeCollection"
          :document
          :clientOptions
          :layout="config.layout"
          :store
          :server="activeServer"
          :isWebhook="isWebhook(entry)" />
      </SectionContainer>
    </template>

    <!-- Webhook Group or Tag -->
    <template v-else-if="isWebhookGroup(entry) || isTag(entry)">
      <Tag
        :tag="entry"
        :layout="config.layout"
        :moreThanOneTag="entries.filter(isTag).length > 1">
        <template v-if="'children' in entry && entry.children?.length">
          <TraversedEntry
            :level="level + 1"
            :entries="entry.children"
            :activeCollection
            :activeServer
            :document
            :clientOptions
            :rootIndex
            :config
            :store />
        </template>
      </Tag>
    </template>

    <template v-else-if="isTagGroup(entry)">
      <!-- Tag Group -->
      <TraversedEntry
        :level="level + 1"
        :rootIndex
        :entries="entry.children || []"
        :activeCollection
        :activeServer
        :clientOptions
        :config
        :document
        :store />
    </template>
  </Lazy>
</template>
