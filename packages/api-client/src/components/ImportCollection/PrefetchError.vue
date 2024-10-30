<script setup lang="ts">
import type { PrefetchResult } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { isUrl } from '@/libs'
import { ScalarIcon } from '@scalar/components'

defineProps<{
  result?: PrefetchResult
}>()
</script>

<template>
  <template v-if="result?.error">
    <div
      v-if="result?.input && isUrl(result.input)"
      class="text-sm break-words text-center w-full font-medium">
      We couldn’t find an OpenAPI document at the provided URL. Please download
      and import the
      <a
        :href="result.input"
        rel="noopener nofollow"
        target="_blank"
        v-text="'OpenAPI document manually'" />.
    </div>

    <div
      v-else
      class="flex gap-2 justify-between items-center pt-2 pl-2 pr-1.5 pb-1.5 font-code text-xs border rounded break-words mt-4 w-full">
      <div class="flex flex-1 gap-2">
        <ScalarIcon
          class="text-red flex-shrink-0"
          icon="Error"
          size="sm" />
        <div class="break-all w-full line-clamp-4">{{ result.error }}</div>
      </div>
    </div>
  </template>
</template>
