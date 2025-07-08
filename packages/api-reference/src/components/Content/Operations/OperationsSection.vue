<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { tagSchema } from '@scalar/oas-utils/entities/spec'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { computed } from 'vue'

import TagSection from '@/components/Content/Tags/TagSection.vue'
import { Operation } from '@/features/Operation'
import {
  traverseTags,
  type TagsMap,
  type TraversedEntry,
  type TraversedOperation,
  type TraversedTag,
} from '@/features/traverse-schema'
import { traversePaths } from '@/features/traverse-schema/helpers/traverse-paths'
import type { TraversedWebhook } from '@/features/traverse-schema/types'

const { document, layout, config } = defineProps<{
  document: OpenAPIV3_1.Document
  layout: 'modern' | 'classic'
  config?: ApiReferenceConfiguration
}>()

const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

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
  // Create a map of tags
  const tagsMap: TagsMap = new Map(
    document.tags?.map((tag: OpenAPIV3_1.TagObject) => [
      tag.name ?? 'Untitled Tag',
      { tag, entries: [] },
    ]) ?? [],
  )

  // Create a default tag if no tags exist
  if (!tagsMap.has('default')) {
    tagsMap.set('default', { tag: { name: 'default' }, entries: [] })
  }

  // Create a map of titles for the mobile header
  const titlesMap = new Map<string, string>()
  traversePaths(
    document,
    tagsMap,
    titlesMap,
    (operation) => operation.summary ?? '',
  )

  // Traverse the tags
  const result = traverseTags(document, tagsMap, titlesMap, {
    getTagId: (tag) => tag.name ?? 'Untitled Tag',
    tagsSorter: config?.tagsSorter,
    operationsSorter: config?.operationsSorter,
  })

  return result
})

const isTagGroup = (entry: TraversedEntry): entry is TraversedTag =>
  'isGroup' in entry && entry.isGroup

const isTag = (entry: TraversedEntry): entry is TraversedTag =>
  'tag' in entry && !isTagGroup(entry)

const isOperation = (entry: TraversedEntry): entry is TraversedOperation =>
  'operation' in entry

const isWebhook = (entry: TraversedEntry): entry is TraversedWebhook =>
  'webhook' in entry
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
                :isWebhook="
                  Boolean('isWebhook' in child && child.isWebhook) || false
                "
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
              {{ child.children }}
              <!-- Operations -->
              <template
                v-for="grandchild in child.children"
                :key="grandchild.id">
                {{ grandchild }}
                <template v-if="isOperation(grandchild)">
                  <Operation
                    :path="grandchild.path"
                    :method="grandchild.method"
                    :isWebhook="
                      Boolean(
                        'isWebhook' in grandchild && grandchild.isWebhook,
                      ) || false
                    "
                    :id="grandchild.id"
                    :document="document"
                    :collection="activeCollection!"
                    :layout="layout"
                    :server="activeServer" />
                </template>
                <template v-else-if="isWebhook(grandchild)">
                  <Operation
                    :path="grandchild.webhook.path"
                    :method="grandchild.webhook.method"
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
  </template>

  <!-- <template v-if="parsedSpec.tags && activeCollection">
    <template v-if="parsedSpec['x-tagGroups']">
      <TagList
        v-for="tagGroup in parsedSpec['x-tagGroups']"
        :document="document"
        :key="tagGroup.name"
        :collection="activeCollection"
        :layout="layout"
        :server="activeServer"
        :spec="parsedSpec"
        :tags="
          tagGroup.tags
            .map((name) => parsedSpec.tags?.find((t) => t.name === name))
            .filter((tag) => !!tag)
        " />
    </template>
    <TagList
      v-else
      :collection="activeCollection"
      :document="document"
      :layout="layout"
      :server="activeServer"
      :spec="parsedSpec"
      :tags="parsedSpec.tags" />
  </template>-->

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
