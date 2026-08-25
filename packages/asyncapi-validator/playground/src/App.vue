<script setup lang="ts">
import { validate } from '@scalar/asyncapi-validator'
import { useCodeMirror } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import { EXAMPLES } from './examples'

const codeMirrorRef = ref<HTMLDivElement | null>(null)

const content = ref(EXAMPLES[0].value)

const { setCodeMirrorContent } = useCodeMirror({
  codeMirrorRef,
  content: content.value,
  language: 'yaml',
  lineNumbers: true,
  onChange: (value) => {
    content.value = value
  },
})

// The validator is synchronous, so results recompute on every keystroke.
const result = computed(() => validate(content.value))

const loadExample = (value: string) => {
  content.value = value
  setCodeMirrorContent(value)
}

const formatPath = (path?: string | string[]) => {
  if (path === undefined || (Array.isArray(path) && path.length === 0)) {
    return ''
  }

  return Array.isArray(path) ? path.join(' → ') : path
}
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50 text-gray-900">
    <header
      class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <h1 class="text-sm font-semibold">Scalar AsyncAPI Validator</h1>
      <div class="ml-auto flex gap-2">
        <button
          v-for="example in EXAMPLES"
          :key="example.name"
          class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          type="button"
          @click="loadExample(example.value)">
          {{ example.name }}
        </button>
      </div>
    </header>

    <main class="grid min-h-0 flex-1 grid-cols-2 divide-x divide-gray-200">
      <!-- The `.scalar-app` wrapper gives CodeMirror the Scalar theme variables. -->
      <section class="scalar-app min-h-0 overflow-auto bg-white">
        <div
          ref="codeMirrorRef"
          class="h-full text-sm" />
      </section>

      <section class="min-h-0 overflow-auto bg-white p-4">
        <div class="mb-4 flex items-center gap-2">
          <span
            class="rounded px-2 py-1 text-xs font-medium"
            :class="
              result.valid
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            ">
            {{ result.valid ? 'Valid' : 'Invalid' }}
          </span>
          <span
            v-if="result.version"
            class="text-xs text-gray-500">
            AsyncAPI {{ result.version }}
          </span>
          <span class="text-xs text-gray-400">
            {{ result.errors.length }}
            {{ result.errors.length === 1 ? 'error' : 'errors' }}
          </span>
        </div>

        <p
          v-if="result.valid"
          class="text-sm text-gray-500">
          This document is valid.
        </p>

        <ul
          v-else
          class="flex flex-col gap-2">
          <li
            v-for="(error, index) in result.errors"
            :key="index"
            class="rounded border border-red-100 bg-red-50 p-3">
            <p class="text-sm text-red-800">{{ error.message }}</p>
            <p
              v-if="formatPath(error.path)"
              class="mt-1 font-mono text-xs text-red-400">
              {{ formatPath(error.path) }}
            </p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
