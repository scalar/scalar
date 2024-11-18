<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/types/legacy'

import { useResponses } from '../hooks/useResponses'
import ParameterList from './ParameterList.vue'
import RequestBody from './RequestBody.vue'

const props = defineProps<{
  webhook: TransformedOperation
}>()

const { responses } = useResponses(props.webhook)
</script>

<template>
  <template v-if="webhook">
    <RequestBody
      class="webhook-request-body"
      :requestBody="webhook.information?.requestBody">
      <template #title>Payload</template>
    </RequestBody>
    <ParameterList
      class="webhook-response-parameters"
      :parameters="responses">
      <template #title>Responses</template>
    </ParameterList>
  </template>
</template>
<style scoped>
.webhook-request-body {
  margin-top: -18px;
}
</style>
