<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/types/legacy'

import OperationResponses from './OperationResponses.vue'
import RequestBody from './RequestBody.vue'

defineProps<{
  // TODO: Do we have webhooks in the store?
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
    <OperationResponses :responses="webhook.responses" />
  </template>
</template>
<style scoped>
.webhook-request-body {
  margin-top: -18px;
}
</style>
