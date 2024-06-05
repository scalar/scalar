<script lang="ts" setup>
import type { TransformedOperation } from '@scalar/oas-utils'

import { useResponses } from '../../../hooks'
import Parameters from '../Operation/Parameters.vue'
import RequestBody from '../Operation/RequestBody.vue'

const props = defineProps<{
  webhook: TransformedOperation
}>()

const { responses } = useResponses(props.webhook)
</script>

<template>
  <template v-if="webhook">
    <RequestBody :requestBody="webhook.information?.requestBody">
      <template #title>Payload</template>
    </RequestBody>
    <Parameters :parameters="responses">
      <template #title>Responses</template>
    </Parameters>
  </template>
</template>
