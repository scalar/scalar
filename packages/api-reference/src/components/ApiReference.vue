<script setup lang="ts">
import type {
  ApiReferenceConfiguration,
  ApiReferenceConfigurationWithSources,
  MultipleApiReferenceConfigurations,
} from '@scalar/types/api-reference'
import { provide, ref, toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?:
    | Partial<ApiReferenceConfiguration>
    | Partial<ApiReferenceConfigurationWithSources>
    | MultipleApiReferenceConfigurations
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
  <SingleApiReference :configuration="selectedConfiguration">
    <template #document-selector>
      <DocumentSelector
        v-model="selectedDocumentIndex"
        :options="availableDocuments" />
    </template>
  </SingleApiReference>
</template>
