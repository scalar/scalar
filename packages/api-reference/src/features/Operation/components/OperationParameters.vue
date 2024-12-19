<script setup lang="ts">
import { useParameters } from '@/hooks'
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'

import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{
  operation: RequestEntity
}>()

const { parameterMap } = useParameters(props.operation)
</script>
<template>
  <!-- Path parameters-->
  <ParameterList :parameters="parameterMap.path">
    <template #title>Path Parameters</template>
  </ParameterList>

  <!-- Query parameters -->
  <ParameterList :parameters="parameterMap.query">
    <template #title>Query Parameters</template>
  </ParameterList>

  <!-- Headers -->
  <ParameterList :parameters="parameterMap.header">
    <template #title>Headers</template>
  </ParameterList>

  <!-- Body parameters -->
  <ParameterList
    :parameters="parameterMap.body"
    showChildren>
    <template #title>Body Parameters</template>
  </ParameterList>

  <!-- Form data -->
  <ParameterList :parameters="parameterMap.formData">
    <template #title>Form Data</template>
  </ParameterList>

  <!-- Request body -->
  <RequestBody
    v-if="operation.information?.requestBody"
    :requestBody="operation.information?.requestBody">
    <template #title>Body</template>
  </RequestBody>
</template>
