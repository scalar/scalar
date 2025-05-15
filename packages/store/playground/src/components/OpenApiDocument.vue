<script setup lang="ts">
import type { OpenAPI } from '@scalar/openapi-types'
import { computed } from 'vue'

const props = defineProps<{
  document?: OpenAPI.Document
}>()

const operations = computed(() => {
  if (!props.document?.paths) {
    return []
  }

  return Object.entries(props.document.paths).flatMap(([path, pathItem]) => {
    return Object.entries(pathItem).map(([method, operation]) => ({
      path,
      method,
      operation,
    }))
  })
})

/**
 * Returns the appropriate color class for a given HTTP method.
 * Uses semantic colors that match common HTTP method associations.
 */
const getMethodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case 'get':
      return 'bg-green-500'
    case 'post':
      return 'bg-blue-500'
    case 'put':
    case 'patch':
      return 'bg-yellow-500'
    case 'delete':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}
</script>

<template>
  <p v-if="!document">Loading…</p>
  <template v-else>
    <table class="border text-sm text-gray-700">
      <tbody>
        <tr>
          <td class="border px-2 py-1 font-bold">OpenAPI</td>
          <td class="border px-2 py-1">
            {{ document?.openapi }}
          </td>
        </tr>
        <tr>
          <td class="border px-2 py-1 font-bold">$.info.title</td>
          <td class="border px-2 py-1">
            {{ document?.info?.title }}
          </td>
        </tr>
        <tr>
          <td class="border px-2 py-1 font-bold">Paths</td>
          <td class="border px-2 py-1">
            {{ Object.keys(document?.paths ?? {}).length }}
          </td>
        </tr>
      </tbody>
    </table>

    <h2 class="my-4 font-bold">Operations</h2>
    <p v-if="!operations.length">Loading … (simulating a slow network)</p>
    <div
      v-if="operations.length"
      class="my-4 px-2 py-1">
      <div class="grid-cols-32 grid gap-1">
        <div
          v-for="op in operations"
          :key="`${op.path}-${op.method}`"
          class="h-2 w-2 rounded-full"
          :class="getMethodColor(op.method)"
          :title="`${op.method.toUpperCase()} ${op.path}`" />
      </div>
    </div>
  </template>
</template>
