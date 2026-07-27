<script setup lang="ts">
import { ScalarIconScroll } from '@scalar/icons'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { useLocalization } from '@/features/localization'

defineProps<{
  value?: InfoObject['termsOfService']
}>()
const { translate } = useLocalization()
</script>

<template>
  <template v-if="value">
    <div
      class="group narrow:border-r-0 narrow:first:ml-0 flex items-center border-r first:ml-auto last:border-r-0">
      <a
        class="text-c-1 hover:bg-b-2 narrow:border mr-2 flex min-h-7 min-w-7 items-center rounded-lg px-2 py-1 no-underline group-last:mr-0"
        :href="value"
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
