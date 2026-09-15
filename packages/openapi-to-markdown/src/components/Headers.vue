<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { HeaderObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import Examples from './Examples.vue'
import Schema from './Schema.vue'

const { headers } = defineProps<{ headers?: Record<string, unknown> }>()
const entries = computed(() =>
  Object.entries(headers ?? {}).flatMap(([name, reference]) => {
    const header = getResolvedRef(reference as HeaderObject)
    return isObject(header)
      ? [
          {
            name,
            header,
            source: {
              example: 'example' in header ? header.example : undefined,
              examples: 'examples' in header ? header.examples : undefined,
            },
          },
        ]
      : []
  }),
)
</script>

<template>
  <section v-if="entries.length">
    <p><strong>Headers:</strong></p>
    <ul>
      <li
        v-for="{ name, header, source } in entries"
        :key="name">
        <p>
          <strong
            ><code>{{ name }}</code></strong
          ><template v-if="header.required"> (required)</template>
        </p>
        <ScalarMarkdown
          v-if="header.description"
          :value="header.description" />
        <Schema
          v-if="'schema' in header && header.schema !== undefined"
          :schema="header.schema" />
        <Examples
          v-if="source.example !== undefined || source.examples"
          :source="source" />
        <template
          v-for="(media, mediaType) in 'content' in header
            ? header.content
            : {}"
          :key="mediaType">
          <p><strong>Content-Type:</strong> {{ mediaType }}</p>
          <Schema
            v-if="media.schema !== undefined"
            :schema="media.schema" />
          <Examples
            :mediaType="mediaType.toString()"
            :source="media" />
        </template>
      </li>
    </ul>
  </section>
</template>
