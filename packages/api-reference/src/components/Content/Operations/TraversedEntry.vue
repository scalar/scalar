<script setup lang="ts">
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'

import { Tag } from '@/components/Content/Tags'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import {
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import type { TraversedWebhook } from '@/features/traverse-schema/types'

defineProps<{
  entries: TraversedEntry[]
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
  activeCollection: Collection
  activeServer: Server | undefined
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
</script>

<template>
  <template
    v-for="entry in entries"
    :key="entry.id">
    <!-- Handle operations at root level -->
    <template v-if="isOperation(entry) || isWebhook(entry)">
      <SectionContainer>
        <Operation
          :path="isWebhook(entry) ? entry.name : entry.path"
          :method="entry.method"
          :id="entry.id"
          :document="document"
          :collection="activeCollection"
          :layout="config.layout"
          :server="activeServer" />
      </SectionContainer>
    </template>

    <!-- Handle webhook groups -->
    <template v-else-if="isWebhookGroup(entry)">
      <Tag
        :tag="entry"
        :layout="config.layout"
        :more-than-one-tag="entries.filter(isTag).length > 1">
        <template v-if="'children' in entry && entry.children?.length">
          <TraversedEntry
            :entries="entry.children"
            :document="document"
            :config="config"
            :activeCollection="activeCollection"
            :activeServer="activeServer" />
        </template>
      </Tag>
    </template>

    <!-- Handle tag groups -->
    <template v-else-if="isTagGroup(entry)">
      <TraversedEntry
        :entries="entry.children || []"
        :document="document"
        :config="config"
        :activeCollection="activeCollection"
        :activeServer="activeServer" />
    </template>

    <!-- Handle regular tags -->
    <template v-else-if="isTag(entry)">
      <Tag
        :tag="entry"
        :layout="config.layout"
        :more-than-one-tag="entries.filter(isTag).length > 1">
        <template v-if="'children' in entry && entry.children?.length">
          <TraversedEntry
            :entries="entry.children"
            :document="document"
            :config="config"
            :activeCollection="activeCollection"
            :activeServer="activeServer" />
        </template>
      </Tag>
    </template>
  </template>
</template>
