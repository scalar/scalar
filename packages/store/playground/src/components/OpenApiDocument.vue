<script setup lang="ts">
import type { OpenAPI } from '@scalar/openapi-types'

defineProps<{
  document?: OpenAPI.Document
}>()
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
  </template>
</template>
