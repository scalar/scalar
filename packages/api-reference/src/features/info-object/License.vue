<script setup lang="ts">
import { ScalarIconGavel } from '@scalar/icons'
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.LicenseObject
}>()
</script>

<template>
  <div
    class="group flex h-fit items-center last:border-r-0 xl:border-r xl:first:ml-auto">
    <a
      class="text-c-1 hover:bg-b-2 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 no-underline group-last:mr-0 xl:border-none"
      v-if="value?.url"
      :href="value.url"
      target="_blank"
      rel="noopener noreferrer">
      <ScalarIconGavel
        weight="bold"
        class="size-3 text-current" />
      <span class="ml-1 empty:hidden">{{
        value?.name || value.identifier || value.url
      }}</span>
    </a>
    <template v-else>
      <ScalarIconGavel
        weight="bold"
        class="size-3 text-current" />
      <span class="ml-1 empty:hidden">{{ value?.name }}</span>
    </template>
  </div>
</template>
