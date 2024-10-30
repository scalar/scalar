<script setup lang="ts">
import type { PrefetchResult } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { isUrl } from '@/libs'
import { ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  result?: PrefetchResult
}>()

const domain = computed(() => {
  if (!props.result?.input || !isUrl(props.result.input)) {
    return undefined
  }

  const hostname = new URL(props.result?.input)?.hostname

  const CHARACTER_LIMIT = 24

  return hostname?.length > CHARACTER_LIMIT
    ? `${hostname.slice(0, CHARACTER_LIMIT)}...`
    : hostname
})
</script>

<template>
  <template v-if="result?.error">
    <div
      v-if="result?.input && domain"
      class="text-sm break-words text-center w-full font-medium">
      We couldn't find an OpenAPI document at this URL. You can try visiting
      <a
        class="max-w-[50ch] truncate"
        :href="result.input"
        rel="noopener nofollow"
        target="_blank"
        v-text="domain" />
      to download the OpenAPI file manually.
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
