<script setup lang="ts">
import { ScalarIconGavel } from '@scalar/icons'
import type { AsyncApiLicenseObject } from '@scalar/types/asyncapi/3.1'
import type { LicenseObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

defineProps<{
  value?: LicenseObject | AsyncApiLicenseObject
}>()
</script>

<template>
  <div
    class="group flex h-fit items-center last:border-r-0 xl:border-r xl:first:ml-auto">
    <a
      v-if="value?.url"
      class="text-c-1 hover:bg-b-2 mr-2 flex min-h-7 min-w-7 items-center rounded-lg border px-2 py-1 no-underline group-last:mr-0 xl:border-none"
      :href="value.url"
      rel="noopener noreferrer"
      target="_blank">
      <ScalarIconGavel
        class="size-3 text-current"
        weight="bold" />
      <span class="ml-1 empty:hidden">{{
        value?.name || ('identifier' in value && value.identifier) || value.url
      }}</span>
    </a>
    <template v-else>
      <ScalarIconGavel
        class="size-3 text-current"
        weight="bold" />
      <span class="ml-1 empty:hidden">{{ value?.name }}</span>
    </template>
  </div>
</template>
