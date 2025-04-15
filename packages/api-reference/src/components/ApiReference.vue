<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { provide, ref, toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import { DeveloperTools } from '@/features/DeveloperTools'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import { NAV_STATE_SYMBOL } from '@/hooks/useNavState'

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
  <div class="scalar-app scalar-api-reference">
    <DeveloperTools />
    <SingleApiReference :configuration="selectedConfiguration">
      <template #document-selector>
        <DocumentSelector
          v-model="selectedDocumentIndex"
          :options="availableDocuments" />
      </template>
    </SingleApiReference>
  </div>
</template>
