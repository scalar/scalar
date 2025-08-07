<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { useResponses } from '../hooks/useResponses'
import ParameterList from './ParameterList.vue'

const props = withDefaults(
  defineProps<{
    responses: OpenAPIV3_1.ResponseObject | undefined
    collapsableItems?: boolean
    schemas?: Record<string, OpenAPIV3_1.SchemaObject> | unknown
    breadcrumb?: string[]
  }>(),
  {
    collapsableItems: true,
  },
)

const { responses } = useResponses(props.responses)
</script>
<template>
  <ParameterList
    :collapsableItems="collapsableItems"
    :parameters="responses"
    :schemas="schemas"
    :withExamples="false"
    :propertyHeading="false">
    <template #title>Responses</template>
  </ParameterList>
</template>
