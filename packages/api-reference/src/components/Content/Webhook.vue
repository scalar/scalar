<script lang="ts" setup>
import type { OpenAPIV3_1 } from 'openapi-types'

// TODO: Expects a `TransformedOperation`
// import { PathResponses } from './ReferenceEndpoint/PathResponses'

defineProps<{
  webhook?: OpenAPIV3_1.OperationObject
}>()
</script>

<template>
  <template v-if="webhook">
    {{ webhook }}
    <!-- <PathResponses :responses="webhook.responses" /> -->
  </template>
</template>
