<script setup lang="ts">
import type {
  ApiReferenceConfiguration,
  ApiReferenceConfigurationWithSources,
} from '@scalar/types/api-reference'
import { toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?:
    | Partial<ApiReferenceConfiguration>
    | Partial<ApiReferenceConfiguration>[]
    | Partial<ApiReferenceConfigurationWithSources>
}>()

const { selectedConfiguration, availableDocuments, selectedDocumentIndex } =
  useMultipleDocuments({
    configuration: toRef(props, 'configuration'),
  })
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
