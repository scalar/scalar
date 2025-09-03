<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
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
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
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
  // // // Don't be lazy if we are a tag group
  // // if (isTagGroup(entry)) {
  // //   return null
  // // }

  // // // Make all previous entries lazy
  // // if (index < currentIndex.value) {
  // //   return false
  // // }

  // // Load the current entry immediately
  // if (hash.value === entry.id) {
  //   return false
  // }

  // // We make the next two siblings not lazy
  // if (index > currentIndex.value + 2) {
  //   return false
  // }

  return true
}

defineExpose({
  currentIndex,
})
</script>

<template>
  <template
    v-for="(entry, index) in entries"
    :key="entry.id">
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <!-- Operation or Webhook -->
      <SectionContainer :omit="!isRootLevel">
        <Lazy
          :id="entry.id"
          :isLazy="isLazy(entry, index)">
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
        </Lazy>
      </SectionContainer>
    </template>

    <!-- Webhook Group or Tag -->
    <template v-else-if="isWebhookGroup(entry) || isTag(entry)">
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
  </template>
</template>
