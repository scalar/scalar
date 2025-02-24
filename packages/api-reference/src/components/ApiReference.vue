<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import { ApiDefinitionSelector } from '@/components/ApiDefinitionSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'
import type { ReferenceConfiguration } from '@/types'

const { configuration } = defineProps<{
  configuration?: ReferenceConfiguration | ReferenceConfiguration[]
}>()

const QUERY_PARAMETER_NAME = 'api'

// TODO: Window refresh instead of hard-coded index?

/**
 * The selected API definition (just a single configuration)
 */
const selectedConfiguration = computed(() => {
  if (Array.isArray(configuration)) {
    return configuration[selectedOption.value]
  }

  return configuration
})

/**
 * All available API definitions for the selector
 */
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

/**
 * The index of the selected API definition
 */
const selectedOption = ref(
  // Get from query parameter
  getSelectedOptionFromQueryParameter(),
)

/**
 * Get the selected API definition from the query parameter
 *
 * @returns The index of the selected API definition
 */
function getSelectedOptionFromQueryParameter() {
  const url = new URL(window.location.href)
  const parameter = url.searchParams.get(QUERY_PARAMETER_NAME) || '0'

  // First try parsing as numeric index
  const numericIndex = Number.parseInt(parameter, 10)

  if (!isNaN(numericIndex) && options.value[numericIndex]) {
    return numericIndex
  }

  // Then try finding by name
  const indexByName = options.value.findIndex(
    (option) => option.name === parameter,
  )

  if (indexByName !== -1) {
    return indexByName
  }

  // Default to first item if no match found
  return 0
}

/**
 * Update the URL query parameter to reflect the selected API definition
 */
watch(
  selectedOption,
  (value) => {
    // Update the URL query parameter to reflect the selected API definition
    const url = new URL(window.location.href)

    // Use the API definition name if available, otherwise use the numeric index
    const selectedDefinition = options.value[value]
    const parameterValue = selectedDefinition?.name ?? value.toString()

    url.searchParams.set(QUERY_PARAMETER_NAME, parameterValue)

    window.history.replaceState({}, '', url.toString())
  },
  {
    immediate: true,
  },
)
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
