<script setup lang="ts">
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

defineProps<{
  parameters: RequestEntity['parameters']
  requestBody: RequestEntity['requestBody']
}>()
</script>
<template>
  <!-- Path parameters-->
  <ParameterList
    :parameters="parameters?.filter((parameter) => parameter.in === 'path')">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList
    :parameters="parameters?.filter((parameter) => parameter.in === 'query')">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList
    :parameters="parameters?.filter((parameter) => parameter.in === 'header')">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Form data -->
  <!-- TODO: How does formdata work in OpenAPI 3.1 again? -->
  <!-- <ParameterList :parameters="parameterMap.formData">
    <template #title>Form Data</template>
  </ParameterList> -->

  <!-- Request body -->
  <RequestBody
    v-if="requestBody"
    :requestBody="requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
