<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/types/legacy'

import OperationResponses from './OperationResponses.vue'
import RequestBody from './RequestBody.vue'

defineProps<{
  webhook: TransformedOperation
}>()
</script>

<template>
  <template v-if="webhook">
    <RequestBody
      class="webhook-request-body"
      :requestBody="webhook.information?.requestBody">
      <template #title>Payload</template>
    </RequestBody>
    <OperationResponses :operation="webhook" />
  </template>
</template>

<style scoped>
.webhook-request-body {
  margin-top: -18px;
}
</style>
