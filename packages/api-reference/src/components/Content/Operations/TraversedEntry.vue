<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

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
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

const { level = 0, entries } = defineProps<{
  level?: number
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
</script>

<template>
  <template
    v-for="entry in entries"
    :key="entry.id">
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <!-- Operation or Webhook -->
      <SectionContainer :omit="!isRootLevel">
        <Lazy :id="entry.id">
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
        :store />
    </template>
  </template>
</template>
