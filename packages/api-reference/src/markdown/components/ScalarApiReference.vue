<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

const { configuration } = defineProps<{
  configuration: Partial<ApiReferenceConfiguration>
}>()

const parsedConfiguration = computed(() =>
  apiReferenceConfigurationSchema.parse(configuration),
)

// TODO: We can't assume it’s always OpenAPI 3.1 and always content, we need the new store here. :)
const content = computed<OpenAPIV3_1.Document>(() =>
  // @ts-expect-error whatever
  normalize(parsedConfiguration.value.content),
)
</script>

<template>
  <h1>{{ content?.info?.title }} ({{ content?.info?.version }})</h1>

  <p>OpenAPI {{ content?.openapi }}</p>

  <ScalarMarkdown
    :value="content?.info?.description"
    v-if="content?.info?.description" />
</template>
