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
    <Parameters :parameters="parameterMap.path">
      <template #title>Path Parameters</template>
    </Parameters>
    <Parameters :parameters="parameterMap.query">
      <template #title>Query Parameters</template>
    </Parameters>
    <Parameters :parameters="parameterMap.header">
      <template #title>Headers</template>
    </Parameters>
    <RequestBody :requestBody="operation.information?.requestBody">
      <template #title>Body</template>
    </RequestBody>
    <Parameters :parameters="responses">
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
</style>
