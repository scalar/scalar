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
    :parameters="filterParameters('path')"
    :schemas="schemas">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :parameters="filterParameters('query')"
    :schemas="schemas">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :parameters="filterParameters('header')"
    :schemas="schemas">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Cookies -->
  <ParameterList
    :parameters="filterParameters('cookie')"
    :schemas="schemas">
    <template #title>Cookies</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    :requestBody="requestBody"
    :schemas="schemas"
    @update:modelValue="handleDiscriminatorChange">
    <template #title>Body</template>
  </RequestBody>
</template>
