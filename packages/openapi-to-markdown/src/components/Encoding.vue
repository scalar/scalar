<script setup lang="ts">
import type { EncodingObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import Headers from './Headers.vue'

const { encoding } = defineProps<{
  encoding?: Record<string, EncodingObject>
}>()
</script>

<template>
  <section v-if="encoding && Object.keys(encoding).length">
    <p><strong>Encoding:</strong></p>
    <ul>
      <li
        v-for="(entry, name) in encoding"
        :key="name">
        <p>
          <strong
            ><code>{{ name }}</code></strong
          >
        </p>
        <ul>
          <li v-if="entry.contentType">
            Content-Type: <code>{{ entry.contentType }}</code>
          </li>
          <li v-if="entry.style">
            Style: <code>{{ entry.style }}</code>
          </li>
          <li v-if="entry.explode !== undefined">
            Explode: <code>{{ entry.explode }}</code>
          </li>
          <li v-if="entry.allowReserved !== undefined">
            Allow reserved: <code>{{ entry.allowReserved }}</code>
          </li>
        </ul>
        <Headers :headers="entry.headers" />
      </li>
    </ul>
  </section>
</template>
