<script setup lang="ts">
import { useOperation, useResponses } from '../../../hooks'
import type { TransformedOperation } from '../../../types'
import Parameters from './Parameters.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { parameterMap } = useOperation(props)

const { responses } = useResponses(props.operation)
</script>
<template>
  <div class="endpoint-details-card">
    <Parameters
      class="endpoint-details-card-item"
      :parameters="parameterMap.path">
      <template #title>Path Parameters</template>
    </Parameters>
    <Parameters
      class="endpoint-details-card-item"
      :parameters="parameterMap.query">
      <template #title>Query Parameters</template>
    </Parameters>
    <Parameters
      class="endpoint-details-card-item"
      :parameters="parameterMap.header">
      <template #title>Headers</template>
    </Parameters>
    <RequestBody
      class="endpoint-details-card-item"
      :requestBody="operation.information?.requestBody">
      <template #title>Body</template>
    </RequestBody>
    <Parameters
      class="endpoint-details-card-item"
      :parameters="responses">
      <template #title>Responses</template>
    </Parameters>
  </div>
</template>
<style scoped>
.endpoint-details-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.endpoint-details-card-item {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  margin-top: 0;
}
.endpoint-details-card :deep(.parameter-list:first-of-type:last-of-type) {
  margin: 0;
}
.endpoint-details-card :deep(.parameter-item:last-of-type .parameter-schema) {
  padding-bottom: 12px;
}
.endpoint-details-card :deep(.parameter-list .parameter-list) {
  margin-bottom: 12px;
}
.endpoint-details-card :deep(.parameter-list li) {
  margin: 0;
  padding: 0 9px;
}
.endpoint-details-card :deep(.property) {
  padding: 9px;
  margin: 0;
}
.endpoint-details-card :deep(.endpoint-title),
.endpoint-details-card :deep(.parameters-title),
.endpoint-details-card :deep(.request-body-title) {
  text-transform: uppercase;
  font-weight: var(--theme-bold, var(--default-theme-bold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.33;
  padding: 9px;
  margin: 0;
}
.endpoint-details-card :deep(.request-body-title-select) {
  text-transform: initial;
  font-weight: initial;
  margin-left: auto;
}
</style>
