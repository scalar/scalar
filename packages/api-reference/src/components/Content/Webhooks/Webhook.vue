<script lang="ts" setup>
// import { CodeMirror } from '@scalar/use-codemirror'
// import { getExampleFromSchema, prettyPrintJson } from '../../helpers'
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
    <!-- Payload Example
    <CodeMirror
      :content="
        prettyPrintJson(
          getExampleFromSchema(
            webhook.information?.requestBody?.content?.['application/json']
              ?.schema,
            {
              emptyString: '…',
            },
          ),
        )
      "
      language="json"
      readOnly /> -->

    <RequestBody :requestBody="webhook.information?.requestBody">
      <template #title>Payload</template>
    </RequestBody>

    <Parameters :parameters="responses">
      <template #title>Responses</template>
    </Parameters>
    <!-- <PathResponses :operation="webhook" /> -->
  </template>
</template>
