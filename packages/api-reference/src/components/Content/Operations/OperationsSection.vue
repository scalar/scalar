<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed, ref } from 'vue'

import TagSection from '@/components/Content/Tags/TagSection.vue'
import { Operation } from '@/features/Operation'
import {
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import { traverseDocument } from '@/features/traverse-schema/helpers/traverse-document'
import type { TraversedWebhook } from '@/features/traverse-schema/types'
import { useNavState } from '@/hooks/useNavState'

const { document, layout, config } = defineProps<{
  document: OpenAPIV3_1.Document
  layout: 'modern' | 'classic'
  config?: ApiReferenceConfiguration
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

// Get navigation state for ID generation functions
const navState = useNavState()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config?.slug) {
    const collection = collections[getSlugUid(config.slug)]
    if (collection) {
      return collection
    }
  }
  return _activeCollection.value
})

/** Ensure the server is the one selected in the collection */
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
  // TODO: We need to pass the actual config to traverseDocument
  if (!config) {
    return []
  }

  // Use traverseDocument to process the OpenAPI document
  const { entries: traversedEntries } = traverseDocument(document, {
    config: ref(config),
    getHeadingId: navState.getHeadingId,
    getOperationId: navState.getOperationId,
    getWebhookId: navState.getWebhookId,
    getModelId: navState.getModelId,
    getTagId: navState.getTagId,
    getSectionId: navState.getSectionId,
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
    v-if="entries.length"
    v-for="entry in entries"
    :key="entry.id">
    <!-- Tag -->
    <template v-if="isTag(entry)">
      <TagSection
        :tag="entry"
        :collection="activeCollection!">
        <template
          v-if="
            'children' in entry && entry.children && entry.children?.length
          ">
          <!-- Operations -->
          <template
            v-for="child in entry.children"
            :key="child.id">
            <!-- Operation -->
            <template v-if="isOperation(child)">
              <Operation
                :path="child.path"
                :method="child.method"
                :isWebhook="false"
                :id="child.id"
                :document="document"
                :collection="activeCollection!"
                :layout="layout"
                :server="activeServer" />
            </template>

            <!-- Webhook -->
            <template v-else-if="isWebhook(child)">
              <Operation
                :path="child.name"
                :method="child.method"
                :isWebhook="true"
                :id="child.id"
                :document="document"
                :collection="activeCollection!"
                :layout="layout"
                :server="activeServer" />
            </template>
          </template>
        </template>
      </TagSection>
    </template>

    <!-- Tag Group -->
    <template v-else-if="isTagGroup(entry)">
      <template
        v-for="child in entry.children"
        :key="child.id">
        <!-- Tag -->
        <template v-if="isTag(child)">
          <TagSection
            :tag="child"
            :collection="activeCollection!">
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
                    :isWebhook="false"
                    :id="grandchild.id"
                    :document="document"
                    :collection="activeCollection!"
                    :layout="layout"
                    :server="activeServer" />
                </template>
                <!-- Webhook -->
                <template v-else-if="isWebhook(grandchild)">
                  <Operation
                    :path="grandchild.name"
                    :method="grandchild.method"
                    :isWebhook="true"
                    :id="grandchild.id"
                    :document="document"
                    :collection="activeCollection!"
                    :layout="layout"
                    :server="activeServer" />
                </template>
              </template>
            </template>
          </TagSection>
        </template>
      </template>
    </template>

    <!-- Webhooks -->
    <template v-if="isWebhookGroup(entry)">
      <!-- TODO: We need something else here, the TagSection has the OperationsList -->
      <TagSection
        :tag="entry"
        :collection="activeCollection!">
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
                :isWebhook="false"
                :id="grandchild.id"
                :document="document"
                :collection="activeCollection!"
                :layout="layout"
                :server="activeServer" />
            </template>
            <!-- Webhook -->
            <template v-else-if="isWebhook(grandchild)">
              <Operation
                :path="grandchild.name"
                :method="grandchild.method"
                :isWebhook="true"
                :id="grandchild.id"
                :document="document"
                :collection="activeCollection!"
                :layout="layout"
                :server="activeServer" />
            </template>
          </template>
        </template>
      </TagSection>
    </template>
  </template>

  <!-- Webhooks -->
  <!-- <template v-if="parsedSpec.webhooks?.length && activeCollection">
    <TagList
      :document="document"
      id="webhooks"
      :collection="activeCollection"
      :layout="layout"
      :server="activeServer"
      :spec="parsedSpec"
      :tags="[
        {
          name: 'Webhooks',
          description: '',
          operations: parsedSpec.webhooks,
        },
      ]">
    </TagList>
  </template> -->
</template>
