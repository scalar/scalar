<script setup lang="ts">
import { isDefined } from '@scalar/oas-utils/helpers'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

import { ApiDefinitionSelector } from '@/components/ApiDefinitionSelector'
import SingleApiReference from '@/components/SingleApiReference.vue'

const { configuration } = defineProps<{
  configuration?: ApiReferenceConfiguration | ApiReferenceConfiguration[]
}>()

/** Normalize configurations into a flat array */
const configurations = computed(() => [configuration].flat())

/**
 * Pass down a single configuration only
 *
 * TODO: Make this selectable
 */
const selectedConfiguration = computed(() =>
  apiReferenceConfigurationSchema.parse(configurations.value[0]),
)

/** Create a flat array from all configurations */
const options = computed(() =>
  configurations.value.map((config) => config?.spec).filter(isDefined),
)
</script>

<template>
  <SingleApiReference :configuration="selectedConfiguration">
    <template #api-definition-selector>
      <ApiDefinitionSelector :options="options" />
    </template>
  </SingleApiReference>
</template>
