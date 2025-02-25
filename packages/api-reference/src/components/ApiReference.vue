<script setup lang="ts">
import { toRef } from 'vue'

import { DocumentSelector } from '@/components/DocumentSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import type { ReferenceConfiguration } from '@/types'

const props = defineProps<{
  configuration?: ReferenceConfiguration | ReferenceConfiguration[]
}>()

const { selectedConfiguration, options, selectedOption } = useMultipleDocuments(
  {
    configuration: toRef(props, 'configuration'),
  },
)
</script>

<template>
  <SingleApiReference :configuration="selectedConfiguration">
    <template #document-selector>
      <DocumentSelector
        v-model="selectedOption"
        :options="options" />
    </template>
  </SingleApiReference>
</template>
