<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'

import { ApiDefinitionSelector } from '@/components/ApiDefinitionSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import type { ReferenceConfiguration } from '@/types'

const { configuration } = defineProps<{
  configuration?: ReferenceConfiguration | ReferenceConfiguration[]
}>()

// TODO: Window refresh instead of hard-coded index

// Pass down a single configuration only
const selectedConfiguration = computed(() => {
  if (Array.isArray(configuration)) {
    return configuration[selectedOption.value]
  }

  return configuration
})

// All available API definitions for the selector
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

// The selected API definition
const selectedOption = ref(0)
</script>

<template>
  <SingleApiReference :configuration="selectedConfiguration">
    <template #api-definition-selector>
      <ApiDefinitionSelector
        v-model="selectedOption"
        :options="options" />
    </template>
  </SingleApiReference>
</template>
