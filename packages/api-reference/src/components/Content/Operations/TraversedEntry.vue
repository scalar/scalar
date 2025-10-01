<script setup lang="ts">
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type {
  TraversedEntry,
  TraversedOperation,
  TraversedTag,
  TraversedWebhook,
} from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import { Tag } from '@/components/Content/Tags'
import { Lazy } from '@/components/Lazy'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import { useNavState } from '@/hooks/useNavState'

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
const isTagGroup = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: true } =>
  entry['type'] === 'tag' && entry.isGroup === true

const isTag = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: false } =>
  entry['type'] === 'tag' && !isTagGroup(entry)

const isOperation = (entry: TraversedEntry): entry is TraversedOperation =>
  entry['type'] === 'operation'

const isWebhook = (entry: TraversedEntry): entry is TraversedWebhook =>
  entry['type'] === 'webhook'

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
  isLazy,
})
</script>

<template>
  <Lazy
    v-for="(entry, index) in entries"
    :id="entry.id"
    :key="entry.id"
    :isLazy="Boolean(isLazy(entry, index))"
    :prev="isLazy(entry, index) === 'prev'">
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <!-- Operation or Webhook -->
      <SectionContainer :omit="!isRootLevel">
        <Operation
          :id="entry.id"
          :clientOptions
          :collection="activeCollection"
          :config="config"
          :document
          :isWebhook="isWebhook(entry)"
          :method="entry.method"
          :path="isWebhook(entry) ? entry.name : entry.path"
          :server="activeServer"
          :store />
      </SectionContainer>
    </template>

    <!-- Webhook Group or Tag -->
    <template v-else-if="isTag(entry)">
      <Tag
        :layout="config.layout"
        :moreThanOneTag="entries.filter(isTag).length > 1"
        :tag="entry">
        <template v-if="'children' in entry && entry.children?.length">
          <TraversedEntry
            :activeCollection
            :activeServer
            :clientOptions
            :config
            :document
            :entries="entry.children"
            :level="level + 1"
            :rootIndex
            :store />
        </template>
      </Tag>
    </template>

    <template v-else-if="isTagGroup(entry)">
      <!-- Tag Group -->
      <TraversedEntry
        :activeCollection
        :activeServer
        :clientOptions
        :config
        :document
        :entries="entry.children || []"
        :level="level + 1"
        :rootIndex
        :store />
    </template>
  </Lazy>
</template>
