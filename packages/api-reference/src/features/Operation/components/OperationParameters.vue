<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ParameterObject,
  ReferenceType,
  RequestBodyObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { shouldIgnoreEntity } from '@/features/Operation/helpers/should-ignore-entity'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const { parameters = [], requestBody } = defineProps<{
  breadcrumb?: string[]
  parameters?: ReferenceType<ParameterObject>[]
  requestBody?: RequestBodyObject | undefined
  eventBus: WorkspaceEventBus | null
  options: Pick<
    OperationProps['options'],
    'hideModels' | 'orderRequiredPropertiesFirst' | 'orderSchemaPropertiesBy'
  >
}>()

/** Thread the selected request body content type up to the layout */
const selectedContentType = defineModel<string>('selectedContentType')

type ParameterLocation = 'cookie' | 'header' | 'path' | 'query'

/**
 * Deep object query parameters serialize as name[prop] pairs in URLs.
 * Rendering the same shape here keeps docs aligned with the request UI.
 */
const flattenDeepObjectQueryParameter = (parameter: ParameterObject): ParameterObject[] => {
  if (parameter.in !== 'query' || parameter.style !== 'deepObject') {
    return [parameter]
  }

  if (!('schema' in parameter) || !parameter.schema) {
    return [parameter]
  }

  const resolvedSchema = getResolvedRef(parameter.schema)

  return flattenDeepObjectProperties(parameter, resolvedSchema, parameter.name)
}

const flattenDeepObjectProperties = (
  parameter: ParameterObject,
  schema: SchemaObject,
  namePrefix: string,
): ParameterObject[] => {
  if (schema.type !== 'object' || !schema.properties) {
    return [parameter]
  }

  const requiredProperties = new Set(schema.required ?? [])
  const flattenedParameters = Object.entries(schema.properties).flatMap(([propertyName, propertySchema]) => {
    const resolvedPropertySchema = getResolvedRef(propertySchema)
    const nestedName = `${namePrefix}[${propertyName}]`

    if (resolvedPropertySchema.type === 'object' && resolvedPropertySchema.properties) {
      return flattenDeepObjectProperties(parameter, resolvedPropertySchema, nestedName)
    }

    return [
      {
        ...parameter,
        name: nestedName,
        description: resolvedPropertySchema.description ?? parameter.description,
        required: requiredProperties.has(propertyName),
        schema: resolvedPropertySchema,
        example: undefined,
        examples: undefined,
      },
    ]
  })

  return flattenedParameters.length > 0 ? flattenedParameters : [parameter]
}

/** Use a single loop to reduce parameters by type(in) */
const splitParameters = computed(() =>
  (parameters ?? []).reduce(
    (acc, p) => {
      const parameter = getResolvedRef(p)
      // Filter out ignored parameters
      if (!shouldIgnoreEntity(parameter)) {
        const flattenedParameters = flattenDeepObjectQueryParameter(parameter)
        flattenedParameters.forEach((flattenedParameter) => {
          acc[flattenedParameter.in as ParameterLocation].push(flattenedParameter)
        })
      }
      return acc
    },
    { cookie: [], header: [], path: [], query: [] } as Record<
      'cookie' | 'header' | 'path' | 'query',
      ParameterObject[]
    >,
  ),
)
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['path']">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['query']">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['header']">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :parameters="splitParameters['cookie']">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    v-model:selectedContentType="selectedContentType"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :eventBus="eventBus"
    :options="options"
    :requestBody="requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
