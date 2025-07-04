<script setup lang="ts">
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { getSlugUid } from '@scalar/oas-utils/transforms'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import { computed } from 'vue'

import { IntroductionSection } from '@/components/Content/Introduction'
import { useConfig } from '@/hooks/useConfig'

import { Loading } from './Lazy'
import { Models, ModelsAccordion } from './Models'
import { TagList } from './Tag'

withDefaults(
  defineProps<{
    document: OpenAPIV3_1.Document
    parsedSpec: Spec
    layout?: 'modern' | 'classic'
  }>(),
  {
    layout: 'modern',
  },
)

const config = useConfig()
const { collections, servers } = useWorkspace()
const { activeCollection: _activeCollection } = useActiveEntities()

/** Match the collection by slug if provided */
const activeCollection = computed(() => {
  if (config.value.slug) {
    const collection = collections[getSlugUid(config.value.slug)]
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
</script>
<template>
  <!-- For adding gradients + animations to introduction of documents that :before / :after won't work for -->
  <div class="section-flare">
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
    <div class="section-flare-item"></div>
  </div>
  <div class="narrow-references-container">
    <slot name="start" />
    <Loading
      v-if="activeCollection"
      :document="document"
      :collection="activeCollection"
      :layout="layout"
      :parsedSpec="parsedSpec"
      :server="activeServer" />

    <IntroductionSection
      v-if="document?.info?.title || document?.info?.description"
      :document="document"
      :layout="layout" />
    <slot
      v-else
      name="empty-state" />

    <template v-if="parsedSpec.tags && activeCollection">
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
    </template>

    <!-- Webhooks -->
    <template v-if="parsedSpec.webhooks?.length && activeCollection">
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
    </template>

    <template v-if="document?.components?.schemas && !config.hideModels">
      <ModelsAccordion
        v-if="layout === 'classic'"
        :schemas="document?.components?.schemas" />
      <Models
        v-else
        :schemas="document?.components?.schemas" />
    </template>
    <slot name="end" />
  </div>
</template>

<style>
.narrow-references-container {
  container-name: narrow-references-container;
  container-type: inline-size;
}
</style>

<style scoped>
.section-flare {
  top: 0;
  right: 0;
  pointer-events: none;
}
</style>
