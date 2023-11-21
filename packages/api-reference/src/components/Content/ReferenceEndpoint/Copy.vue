<script setup lang="ts">
import { computed } from 'vue'

import { useOperation } from '../../../hooks'
import type { TransformedOperation } from '../../../types'
import MarkdownRenderer from '../MarkdownRenderer.vue'
// import Schema from '../Schema.vue'
import Parameters from './Parameters.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { parameterMap } = useOperation(props)

const responseArray = computed(() => {
  const { responses } = props.operation.information

  const res: { name: string; description: string }[] = []

  if (responses) {
    Object.keys(responses).forEach((statusCode: string) => {
      res.push({
        name: statusCode,
        description: responses[statusCode].description,
      })
    })
  }

  return res
})
</script>
<template>
  <div class="copy">
    <div class="description">
      <MarkdownRenderer :value="operation.description" />
    </div>
    <Parameters
      :parameters="parameterMap.path"
      title="Path Parameters" />
    <Parameters
      :parameters="parameterMap.query"
      title="Query Parameters" />
    <Parameters
      :parameters="parameterMap.header"
      title="Headers" />
    <!-- <div class="title">Body</div>
    <Schema
      :value="
        operation.information?.requestBody?.content['application/json']?.schema
      " /> -->
    <RequestBody :requestBody="operation.information?.requestBody" />
    <Parameters
      :parameters="responseArray"
      title="Responses" />
  </div>
</template>

<style scoped>
.description {
  margin-bottom: 24px;
}
</style>
