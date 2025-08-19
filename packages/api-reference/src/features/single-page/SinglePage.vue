<script lang="ts">
/**
 * Single page operations/tags/models
 *
 * This works by checking the hash and just switching between the correct components
 */
export default {}
</script>

<script setup lang="ts">
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

const { document, config } = defineProps<{
  document: OpenApiDocument
}>
</script>

<template>
  <div>
    <h1>Single Page</h1>
  </div>
</template>
