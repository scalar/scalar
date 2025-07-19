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

/** The index of the current entry, we make the next two siblings not lazy */
const currentIndex = computed(() =>
  entries.findIndex((entry) => hash.value.startsWith(entry.id)),
)

defineExpose({
  currentIndex,
})
</script>

<template>
  <Lazy
    v-for="(entry, index) in entries"
    :key="entry.id"
    :id="entry.id"
    :isLazy="
      Boolean(hash) && (index < currentIndex || index > currentIndex + 2)
    ">
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
