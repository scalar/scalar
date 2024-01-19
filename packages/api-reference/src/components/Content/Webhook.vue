<script lang="ts" setup>
import { CodeMirror } from '@scalar/use-codemirror'

import type { TransformedOperation } from '../../types'

// import ExampleRequest from './ReferenceEndpoint/ExampleRequest.vue'
// import { PathResponses } from './ReferenceEndpoint/PathResponses'

defineProps<{
  webhook?: TransformedOperation
}>()
</script>

<template>
  <template v-if="webhook">
    <!-- <pre><code>{{ JSON.stringify(webhook, null, 2) }}</code></pre> -->
    <!-- <ExampleRequest :operation="webhook" /> -->
    <CodeMirror
      :content="JSON.stringify(webhook.information, null, 2)"
      readOnly />
    <!-- <PathResponses :operation="webhook" /> -->
  </template>
</template>
