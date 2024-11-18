<script setup lang="ts">
import type { TransformedOperation } from '@scalar/types/legacy'

import { useOperation, useResponses } from '../../../hooks'
import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { parameterMap } = useOperation(props.operation)

const { responses } = useResponses(props.operation)
</script>
<template>
  <div class="operation-details-card">
    <ParameterList
      class="operation-details-card-item"
      :parameters="parameterMap.path">
      <template #title>Path Parameters</template>
    </ParameterList>
    <ParameterList
      class="operation-details-card-item"
      :parameters="parameterMap.query">
      <template #title>Query Parameters</template>
    </ParameterList>
    <ParameterList
      class="operation-details-card-item"
      :parameters="parameterMap.header">
      <template #title>Headers</template>
    </ParameterList>
    <RequestBody
      class="operation-details-card-item"
      :requestBody="operation.information?.requestBody">
      <template #title>Body</template>
    </RequestBody>
    <ParameterList
      class="operation-details-card-item"
      :parameters="responses">
      <template #title>Responses</template>
    </ParameterList>
  </div>
</template>
<style scoped>
.operation-details-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.operation-details-card-item {
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  margin-top: 0;
}
.operation-details-card :deep(.parameter-list:first-of-type:last-of-type) {
  margin: 0;
}
.operation-details-card :deep(.parameter-item:last-of-type .parameter-schema) {
  padding-bottom: 12px;
}
.operation-details-card :deep(.parameter-list .parameter-list) {
  margin-bottom: 12px;
}
.operation-details-card :deep(.parameter-list li) {
  margin: 0;
  padding: 0 9px;
}
.operation-details-card :deep(.property) {
  padding: 9px;
  margin: 0;
}
.operation-details-card :deep(.endpoint-title),
.operation-details-card :deep(.parameters-title),
.operation-details-card :deep(.request-body-title) {
  text-transform: uppercase;
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-2);
  line-height: 1.33;
  padding: 9px;
  margin: 0;
}
.operation-details-card :deep(.request-body-title-select) {
  text-transform: initial;
  font-weight: initial;
  margin-left: auto;
}
</style>
