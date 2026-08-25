<script setup lang="ts">
import { sanitizeUrl } from '@scalar/helpers/url/is-safe-url'
import { ScalarIconScroll } from '@scalar/icons'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const { value } = defineProps<{
  value?: InfoObject['termsOfService']
}>()
const { translate } = useLocalization()

/**
 * The terms of service URL comes from the OpenAPI document, which is untrusted input, so a
 * protocol like `javascript:` would execute script on click. Hide the link in that case.
 */
const url = computed(() => sanitizeUrl(value))
</script>

<template>
  <template v-if="url">
    <div
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <a
        class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
        :href="url"
        rel="noopener noreferrer"
        target="_blank">
        <ScalarIconScroll
          class="size-3 text-current"
          weight="bold" />
        <span class="ml-1 empty:hidden">
          {{ translate('info.termsOfService') }}
        </span>
      </a>
    </div>
  </template>
</template>
