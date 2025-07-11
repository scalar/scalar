<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed, ref } from 'vue'

import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import {
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import { traverseDocument } from '@/features/traverse-schema/helpers/traverse-document'
import type { TraversedWebhook } from '@/features/traverse-schema/types'
import { useNavState } from '@/hooks/useNavState'

import { Tag } from '../Tags'

const { document, config } = defineProps<{
  document: OpenAPIV3_1.Document
  config: ApiReferenceConfiguration
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

/**
 * Generate IDs for the different types of entities
 */
const {
  getHeadingId,
  getOperationId,
  getWebhookId,
  getModelId,
  getTagId,
  getSectionId,
} = useNavState()

/**
 * Match the collection by slug if provided
 *
 * @deprecated
 **/
const activeCollection = computed(() => {
  if (config?.slug) {
    const collection = collections[getSlugUid(config.slug)]

    if (collection) {
      return collection
    }
  }

  return _activeCollection.value
})

/**
 * Ensure the server is the one selected in the collection
 *
 * @deprecated
 **/
const activeServer = computed(() => {
  if (!activeCollection.value) {
    return undefined
  }

  if (activeCollection.value.selectedServerUid) {
    const server = servers[activeCollection.value.selectedServerUid]
    if (server) {
      return server
    }
  }

  return servers[activeCollection.value.servers[0]]
})

/**
 * A list of tags including their children and operations.
 *
 * Matches the sidebar.
 */
const entries = computed((): TraversedEntry[] => {
  if (!config) {
    return []
  }

  // Use traverseDocument to process the OpenAPI document
  const { entries: traversedEntries } = traverseDocument(document, {
    config: ref(config),
    getHeadingId,
    getOperationId,
    getWebhookId,
    getModelId,
    getTagId,
    getSectionId,
  })

  return traversedEntries
})

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
    v-if="entries.length && activeCollection"
    v-for="entry in entries"
    :key="entry.id">
    <!-- Tag -->
    <template v-if="isTag(entry)">
      <Tag
        :tag="entry"
        :layout="config.layout"
        :moreThanOneTag="entries.filter(isTag).length > 1">
        <template
          v-if="
            'children' in entry && entry.children && entry.children?.length
          ">
          <template
            v-for="child in entry.children"
            :key="child.id">
            <!-- Operation -->
            <template v-if="isOperation(child)">
              <Operation
                :path="child.path"
                :method="child.method"
                :id="child.id"
                :document
                :collection="activeCollection"
                :layout="config.layout"
                :server="activeServer" />
            </template>

            <!-- Webhook -->
            <template v-else-if="isWebhook(child)">
              <Operation
                :path="child.name"
                :method="child.method"
                isWebhook
                :id="child.id"
                :document
                :collection="activeCollection"
                :layout="config.layout"
                :server="activeServer" />
            </template>
          </template>
        </template>
      </Tag>
    </template>

    <!-- Tag Group -->
    <template v-else-if="isTagGroup(entry)">
      <template
        v-for="child in entry.children"
        :key="child.id">
        <!-- Tag -->
        <template v-if="isTag(child)">
          <Tag
            :tag="child"
            :layout="config.layout"
            :moreThanOneTag="entry.children.filter(isTag).length > 1">
            <template
              v-if="
                'children' in child && child.children && child.children?.length
              ">
              <template
                v-for="grandchild in child.children"
                :key="grandchild.id">
                <!-- Operation -->
                <template v-if="isOperation(grandchild)">
                  <Operation
                    :path="grandchild.path"
                    :method="grandchild.method"
                    :id="grandchild.id"
                    :document
                    :collection="activeCollection"
                    :layout="config.layout"
                    :server="activeServer" />
                </template>
                <!-- Webhook -->
                <template v-else-if="isWebhook(grandchild)">
                  <Operation
                    :path="grandchild.name"
                    :method="grandchild.method"
                    isWebhook
                    :id="grandchild.id"
                    :document
                    :collection="activeCollection"
                    :layout="config.layout"
                    :server="activeServer" />
                </template>
              </template>
            </template>
          </Tag>
        </template>
      </template>
    </template>

    <!-- Webhooks -->
    <template v-if="isWebhookGroup(entry)">
      <Tag
        :tag="entry"
        :layout="config.layout"
        :moreThanOneTag="entries.filter(isTag).length > 1">
        <template
          v-if="
            'children' in entry && entry.children && entry.children?.length
          ">
          <template
            v-for="grandchild in entry.children"
            :key="grandchild.id">
            <!-- Operation -->
            <template v-if="isOperation(grandchild)">
              <Operation
                :path="grandchild.path"
                :method="grandchild.method"
                :id="grandchild.id"
                :document
                :collection="activeCollection"
                :layout="config.layout"
                :server="activeServer" />
            </template>
            <!-- Webhook -->
            <template v-else-if="isWebhook(grandchild)">
              <Operation
                :path="grandchild.name"
                :method="grandchild.method"
                isWebhook
                :id="grandchild.id"
                :document
                :collection="activeCollection"
                :layout="config.layout"
                :server="activeServer" />
            </template>
          </template>
        </template>
      </Tag>
    </template>
    <!-- Operations -->
    <template v-if="isOperation(entry)">
      <SectionContainer>
        <Operation
          :path="entry.path"
          :method="entry.method"
          :id="entry.id"
          :document
          :collection="activeCollection"
          :layout="config.layout"
          :server="activeServer" />
      </SectionContainer>
    </template>
  </template>
</template>
