<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { provide, ref, toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'
import ApiReferenceWorkspace from '@/v2/ApiReferenceWorkspace.vue'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?: AnyApiReferenceConfiguration
}>()

const {
  availableDocuments,
  selectedConfiguration,
  selectedDocumentIndex,
  isIntersectionEnabled,
  hash,
  hashPrefix,
} = useMultipleDocuments({
  configuration: toRef(props, 'configuration'),
  isIntersectionEnabled: ref(false),
  hash: ref(''),
  hashPrefix: ref(''),
})

// Provide the intersection observer which has defaults
provide(NAV_STATE_SYMBOL, { isIntersectionEnabled, hash, hashPrefix })
</script>

<template>
  <ApiReferenceWorkspace :configuration="selectedConfiguration">
    <template #document-selector>
      <DocumentSelector
        v-model="selectedDocumentIndex"
        :options="availableDocuments" />
    </template>
  </ApiReferenceWorkspace>
</template>
