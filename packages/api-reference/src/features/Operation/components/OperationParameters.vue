<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Schemas } from '@/features/Operation/types/schemas'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const {
  parameters = [],
  requestBody,
  schemas,
} = defineProps<{
  breadcrumb?: string[]
  parameters?: OpenAPIV3_1.ParameterObject[]
  requestBody?: OpenAPIV3_1.RequestBodyObject | undefined
  schemas?: Schemas
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const handleDiscriminatorChange = (type: string) => {
  emit('update:modelValue', type)
}

const filterParameters = (where: 'path' | 'query' | 'header' | 'cookie') =>
  parameters?.filter((parameter) => parameter.in === where) ?? []
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'path'] : undefined"
    :parameters="filterParameters('path')"
    :schemas="schemas">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'query'] : undefined"
    :parameters="filterParameters('query')"
    :schemas="schemas">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :parameters="filterParameters('header')"
    :schemas="schemas">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :breadcrumb="breadcrumb ? [...breadcrumb, 'cookies'] : undefined"
    :parameters="filterParameters('cookie')"
    :schemas="schemas">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'body'] : undefined"
    :requestBody="requestBody"
    :schemas="schemas"
    @update:modelValue="handleDiscriminatorChange">
    <template #title>Body</template>
  </RequestBody>
</template>
