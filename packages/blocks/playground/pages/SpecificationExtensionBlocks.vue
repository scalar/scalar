<script setup lang="ts">
import { computed, ref } from 'vue'

import { SpecificationExtensions } from '../../src/specification-extensions'

const source = ref(
  JSON.stringify(
    {
      'x-scopes': ['directories', 'directories.readonly'],
      'x-metadata': {
        owner: 'Platform',
        policy: { enabled: false, retries: 0 },
      },
      'x-rules': [{ roles: ['admin', 'reader'], limit: 100 }],
    },
    null,
    2,
  ),
)
const parsed = computed<{ extensions: Record<string, unknown>; error: string }>(
  () => {
    try {
      const value: unknown = JSON.parse(source.value)
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return {
          extensions: {},
          error: 'Enter a JSON object with extension names and values.',
        }
      }
      return {
        extensions: Object.fromEntries(Object.entries(value)),
        error: '',
      }
    } catch {
      return {
        extensions: {},
        error: 'Enter valid JSON to update the preview.',
      }
    }
  },
)
</script>

<template>
  <div class="scalar-app text-c-1 mx-auto max-w-5xl">
    <h1 class="mb-2 text-xl font-semibold">Specification Extensions</h1>
    <p class="text-c-2 mb-6">
      Edit the values to try arrays, nested objects, and simple text.
    </p>
    <div class="grid gap-8 md:grid-cols-2">
      <div>
        <label
          class="mb-2 block font-medium"
          for="extension-values"
          >Extension values</label
        >
        <textarea
          id="extension-values"
          v-model="source"
          class="bg-b-1 font-code min-h-96 w-full rounded-lg border p-3 text-sm"
          spellcheck="false"
          :aria-invalid="Boolean(parsed.error)"
          :aria-describedby="parsed.error ? 'extension-error' : undefined" />
        <p
          v-if="parsed.error"
          id="extension-error"
          role="alert"
          class="mt-2">
          {{ parsed.error }}
        </p>
      </div>
      <section aria-label="Live preview">
        <h2 class="mb-2 font-medium">Live preview</h2>
        <SpecificationExtensions :extensions="parsed.extensions" />
      </section>
    </div>
  </div>
</template>
