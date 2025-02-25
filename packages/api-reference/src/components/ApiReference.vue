<script setup lang="ts">
import { toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import type {
  ReferenceConfiguration,
  ReferenceConfigurationWithSources,
} from '@/types'

const props = defineProps<{
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration?:
    | ReferenceConfiguration
    | ReferenceConfiguration[]
    | ReferenceConfigurationWithSources
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
