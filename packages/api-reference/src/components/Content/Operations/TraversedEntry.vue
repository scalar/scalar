<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref } from 'vue'

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

const { level = 0, entries } = defineProps<{
  level?: number
  entries: TraversedEntry[]
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
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
  const targetId = hash.value.startsWith('model') ? 'models' : hash.value
  return entries.findIndex((entry) => targetId.startsWith(entry.id))
})

/** Check if the entry should be lazy loaded */
const isLazy = (index: number) => {
  if (!hash.value) {
    return false
  }

  // For models, just make the previous two entries not lazy
  if (hash.value.startsWith('model')) {
    return index === currentIndex.value
  }

  // Make all previous entries lazy
  if (index < currentIndex.value) {
    return true
  }

  // We make the next two siblings not lazy
  if (index > currentIndex.value + 2) {
    return true
  }

  return false
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
    :isLazy="isLazy(index)">
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <!-- Operation or Webhook -->
      <SectionContainer :omit="!isRootLevel">
        <Operation
          :path="isWebhook(entry) ? entry.name : entry.path"
          :method="entry.method"
          :id="entry.id"
          :document="document"
          :collection="activeCollection"
          :layout="config.layout"
          :store="store"
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
            :document="document"
            :config="config"
            :store="store"
            :activeCollection="activeCollection"
            :activeServer="activeServer" />
        </template>
      </Tag>
    </template>

    <template v-else-if="isTagGroup(entry)">
      <!-- Tag Group -->
      <TraversedEntry
        :level="level + 1"
        :entries="entry.children || []"
        :document="document"
        :config="config"
        :store="store"
        :activeCollection="activeCollection"
        :activeServer="activeServer" />
    </template>
  </Lazy>
</template>
