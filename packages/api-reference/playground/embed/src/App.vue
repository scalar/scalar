<script setup lang="ts">
import '../../../dist/style.css'
import { OpenApiDocument } from '../../../src/embeds/index'
</script>

<template>
  <OpenApiDocument
    v-slot="{ dereferenced }"
    :configuration="{
      proxy: 'https://proxy.scalar.com',
    }"
    content="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json">
    <pre><code>{{ JSON.stringify(dereferenced?.info, null, 2) }}</code></pre>
  </OpenApiDocument>
</template>
