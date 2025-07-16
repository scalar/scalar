<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

import { Tag } from '@/components/Content/Tags'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import {
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import type { TraversedWebhook } from '@/features/traverse-schema/types'

const { level = 0 } = defineProps<{
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
</script>

<template>
  <template
    v-for="entry in entries"
    :key="entry.id">
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

    <template v-else-if="isWebhookGroup(entry)">
      <!-- Webhook Heading -->
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

    <template v-else-if="isTag(entry)">
      <!-- Tag -->
      <Tag
        :tag="entry"
        :layout="config.layout"
        :more-than-one-tag="entries.filter(isTag).length > 1">
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
  </template>
</template>
