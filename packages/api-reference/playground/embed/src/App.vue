<script setup lang="ts">
import '../../../dist/style.css'
import { ExampleRequest, OpenApiDocument } from '../../../src/embeds/index'
</script>

<template>
  <OpenApiDocument
    v-slot="{ configuration, dereferenced, transformed }"
    :configuration="{
      proxy: 'https://proxy.scalar.com',
    }"
    content="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json">
    <!-- <pre><code>{{ JSON.stringify(dereferenced?.info, null, 2) }}</code></pre> -->

    <ExampleRequest
      :configuration="configuration"
      :dereferenced="dereferenced"
      :operation="transformed.tags?.[0]?.operations?.[0]"
      :transformed="transformed" />
  </OpenApiDocument>
</template>
