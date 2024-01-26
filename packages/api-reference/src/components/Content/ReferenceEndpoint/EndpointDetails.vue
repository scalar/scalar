<script setup lang="ts">
import { computed } from 'vue'

import { getParametersFromOperation } from '../../../helpers'
import { useOperation, useResponses } from '../../../hooks'
import type { TransformedOperation } from '../../../types'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import Parameters from './Parameters.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { parameterMap } = useOperation(props)

const { responses } = useResponses(props.operation)
</script>
<template>
  <div class="endpoint-details">
    <div class="endpoint-description">
      <MarkdownRenderer :value="operation.description" />
    </div>
    <Parameters :parameters="parameterMap.path">
      <template #title>Path Parameters</template>
    </Parameters>
    <Parameters :parameters="parameterMap.query">
      <template #title>Query Parameters</template>
    </Parameters>
    <Parameters :parameters="parameterMap.header">
      <template #title>Headers</template>
    </Parameters>
    <Parameters
      :parameters="parameterMap.body"
      showChildren>
      <template #title>Body Parameters</template>
    </Parameters>
    <Parameters :parameters="parameterMap.formData">
      <template #title>Form Data</template>
    </Parameters>
    <RequestBody
      v-if="operation.information?.requestBody"
      :requestBody="operation.information?.requestBody">
      <template #title>Body</template>
    </RequestBody>
    <Parameters :parameters="responses">
      <template #title>Responses</template>
    </Parameters>
  </div>
</template>
<style scoped></style>
