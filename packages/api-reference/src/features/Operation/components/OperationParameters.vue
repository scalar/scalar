<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'
import type {
  OpenApiDocument,
  ParameterObject,
  ReferenceType,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import { flattenDeepObjectQueryParameter } from '@/features/Operation/helpers/flatten-deep-object-query-parameter'
import type { OperationProps } from '@/features/Operation/Operation.vue'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const { parameters = [], requestBody } = defineProps<
  {
    breadcrumb?: string[]
    parameters?: ReferenceType<ParameterObject>[]
    requestBody?: RequestBodyObject | undefined
    eventBus: WorkspaceEventBus | null
    /** The document the operation belongs to, used to resolve schema references for display */
    document?: OpenApiDocument
    options: Pick<
      OperationProps['options'],
      | 'expandAllParameters'
      | 'hideModels'
      | 'orderRequiredPropertiesFirst'
      | 'orderSchemaPropertiesBy'
      | 'expandAllSchemaProperties'
      | 'schemaKeyboardNav'
      | 'showExtensions'
      | 'maxVisibleRequestBodyProperties'
      | 'hideModelNames'
    >
  } & SchemaRenderingProps
>()
const { translate } = useLocalization()

/** Thread the selected request body content type up to the layout */
const selectedContentType = defineModel<string>('selectedContentType')

type ParameterLocation = Exclude<ParameterObject['in'], 'querystring'>

/** Keep large filter objects together without changing their request representation. */
const parameterSections = computed(() => {
  const locations: Record<ParameterLocation, ParameterObject[]> = {
    cookie: [],
    header: [],
    path: [],
    query: [],
  }
  const groups = new Map<ParameterObject, ParameterObject[]>()

  for (const reference of parameters) {
    const parameter = getResolvedRef(reference)
    if (!parameter || isHidden(parameter)) {
      continue
    }

    const flattened = flattenDeepObjectQueryParameter(parameter)
    const location = parameter.in === 'querystring' ? 'query' : parameter.in
    if (flattened.length > 5) {
      locations[location].push(parameter)
      groups.set(parameter, flattened)
    } else {
      locations[location].push(...flattened)
    }
  }

  return { locations, groups }
})
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :collapsableItems="options.expandAllParameters === false"
    :document="document"
    :eventBus="eventBus"
    :expansion="expansion"
    :options="options"
    :parameters="parameterSections.locations['path']"
    :scrollTargetId="scrollTargetId"
    :specificationExtension="specificationExtension">
    <template #title>{{ translate('operation.pathParameters') }}</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :collapsableItems="options.expandAllParameters === false"
    :document="document"
    :eventBus="eventBus"
    :expansion="expansion"
    :options="options"
    :parameterGroups="parameterSections.groups"
    :parameters="parameterSections.locations['query']"
    :scrollTargetId="scrollTargetId"
    :specificationExtension="specificationExtension">
    <template #title>{{ translate('operation.queryParameters') }}</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :collapsableItems="options.expandAllParameters === false"
    :document="document"
    :eventBus="eventBus"
    :expansion="expansion"
    :options="options"
    :parameters="parameterSections.locations['header']"
    :scrollTargetId="scrollTargetId"
    :specificationExtension="specificationExtension">
    <template #title>{{ translate('operation.headers') }}</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :collapsableItems="options.expandAllParameters === false"
    :document="document"
    :eventBus="eventBus"
    :expansion="expansion"
    :options="options"
    :parameters="parameterSections.locations['cookie']"
    :scrollTargetId="scrollTargetId"
    :specificationExtension="specificationExtension">
    <template #title>{{ translate('operation.cookies') }}</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    v-model:selectedContentType="selectedContentType"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :document="document"
    :eventBus="eventBus"
    :expansion="expansion"
    :options="options"
    :requestBody="requestBody"
    :scrollTargetId="scrollTargetId"
    :specificationExtension="specificationExtension">
    <template #title>{{ translate('operation.body') }}</template>
  </RequestBody>
</template>
