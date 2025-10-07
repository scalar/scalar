<script setup lang="ts">
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type {
  TraversedEntry,
  TraversedOperation,
  TraversedTag,
  TraversedWebhook,
} from '@scalar/workspace-store/schemas/navigation'
import type {
  PathsObject,
  SecurityRequirementObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getCurrentIndex } from '@/components/Content/Operations/get-current-index'
import { Tag } from '@/components/Content/Tags'
import { Lazy } from '@/components/Lazy'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import type { SecuritySchemeGetter } from '@/v2/helpers/map-config-to-client-store'

const {
  level = 0,
  entries,
  rootIndex,
  paths,
  webhooks,
  security,
  hash,
} = defineProps<{
  level?: number
  hash: string
  rootIndex: number
  entries: TraversedEntry[]
  /** The path entries from the document `document.paths` */
  paths: PathsObject
  /** The webhook path entries from the document `document.webhooks` */
  webhooks: PathsObject
  /** The security requirements from the document `document.security` */
  security: SecurityRequirementObject[] | undefined
  activeServer: Server | undefined
  getSecuritySchemes: SecuritySchemeGetter
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  options: {
    layout: 'classic' | 'modern'
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses: boolean | undefined
    clientOptions: ClientOptionGroup[]
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
    onShowMore: ((id: string) => void) | undefined
  }
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

/** The index of the current entry */
const currentIndex = computed(() => {
  if (isRootLevel.value) {
    return rootIndex
  }

  return getCurrentIndex(hash, entries)
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

function getPathValue(entry: TraversedOperation | TraversedWebhook) {
  return isWebhook(entry) ? webhooks[entry.name] : paths[entry.path]
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
          :getSecurityScheme="getSecuritySchemes"
          :method="entry.method"
          :options="{
            ...options,
            isWebhook: isWebhook(entry),
          }"
          :path="isWebhook(entry) ? entry.name : entry.path"
          :pathValue="getPathValue(entry)"
          :security="security"
          :server="activeServer"
          :xScalarDefaultClient="xScalarDefaultClient" />
      </SectionContainer>
    </template>

    <!-- Webhook Group or Tag -->
    <template v-else-if="isTag(entry)">
      <Tag
        :isLoading="false"
        :layout="options.layout"
        :moreThanOneTag="entries.filter(isTag).length > 1"
        :onShowMore="options.onShowMore"
        :tag="entry">
        <template v-if="'children' in entry && entry.children?.length">
          <TraversedEntry
            :activeServer
            :entries="entry.children"
            :getSecuritySchemes="getSecuritySchemes"
            :hash="hash"
            :level="level + 1"
            :options
            :paths="paths"
            :rootIndex
            :security="security"
            :webhooks="webhooks"
            :xScalarDefaultClient="xScalarDefaultClient" />
        </template>
      </Tag>
    </template>

    <template v-else-if="isTagGroup(entry)">
      <!-- Tag Group -->
      <TraversedEntry
        :activeServer
        :entries="entry.children || []"
        :getSecuritySchemes="getSecuritySchemes"
        :hash="hash"
        :level="level + 1"
        :options
        :paths="paths"
        :rootIndex
        :security="security"
        :webhooks="webhooks"
        :xScalarDefaultClient="xScalarDefaultClient" />
    </template>
  </Lazy>
</template>
