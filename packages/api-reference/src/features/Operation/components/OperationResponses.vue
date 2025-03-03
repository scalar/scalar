<script setup lang="ts">
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types/legacy'

import { useResponses } from '../hooks/useResponses'
import ParameterList from './ParameterList.vue'

const props = withDefaults(
  defineProps<{
    operation: TransformedOperation
    collapsableItems?: boolean
    schemas?:
      | OpenAPIV2.DefinitionsObject
      | Record<string, OpenAPIV3.SchemaObject>
      | Record<string, OpenAPIV3_1.SchemaObject>
      | unknown
  }>(),
  {
    collapsableItems: true,
  },
)

const { responses } = useResponses(props.operation)
</script>
<template>
  <ParameterList
    :collapsableItems="collapsableItems"
    :parameters="responses"
    :withExamples="false"
    :schemas="schemas">
    <template #title>Responses</template>
  </ParameterList>
</template>
