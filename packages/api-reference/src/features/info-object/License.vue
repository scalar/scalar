<script setup lang="ts">
import { sanitizeUrl } from '@scalar/helpers/url/is-safe-url'
import { ScalarIconGavel } from '@scalar/icons'
import type { AsyncApiLicenseObject } from '@scalar/types/asyncapi/3.1'
import type { LicenseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const { value } = defineProps<{
  value?: LicenseObject | AsyncApiLicenseObject
}>()

/**
 * The license URL comes from the OpenAPI document, which is untrusted input, so a protocol like
 * `javascript:` would execute script on click. Fall back to the plain text label in that case.
 */
const url = computed(() => sanitizeUrl(value?.url))
</script>

<template>
  <div
    class="group narrow:border-r-0 narrow:first:ml-0 flex h-fit items-center border-r first:ml-auto last:border-r-0">
    <a
      v-if="url"
      class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
      :href="url"
      rel="noopener noreferrer"
      target="_blank">
      <ScalarIconGavel
        class="size-3 text-current"
        weight="bold" />
      <span class="ml-1 empty:hidden">{{
        value?.name ||
        (value && 'identifier' in value && value.identifier) ||
        url
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
