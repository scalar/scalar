<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import { ApiDefinitionSelector } from '@/components/ApiDefinitionSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import type { ReferenceConfiguration } from '@/types'

const { configuration } = defineProps<{
  configuration?: ReferenceConfiguration | ReferenceConfiguration[]
}>()

// Pass down a single configuration only
const selectedConfiguration = computed(() => {
  if (Array.isArray(configuration)) {
    // TODO: Make this selectable
    return configuration[0]
  }

  return configuration
})

const options = computed(() => {
  // Create an array from all configurations
  if (Array.isArray(configuration)) {
    return configuration.map((config) => config.spec).filter(isDefined)
  }

  // Make it an array
  if (configuration?.spec) {
    return [configuration.spec]
  }

  return []
})
</script>

<template>
  <SingleApiReference :configuration="selectedConfiguration">
    <template #api-definition-selector>
      <ApiDefinitionSelector :options="options" />
    </template>
  </SingleApiReference>
</template>
