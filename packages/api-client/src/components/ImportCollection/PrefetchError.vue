<script setup lang="ts">
import type { PrefetchResult } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { ScalarIcon, useModal } from '@scalar/components'
import { ref } from 'vue'

defineProps<{
  prefetchResult: PrefetchResult
}>()

const errorModalState = useModal()

const errorMessage = ref('')

const handleExpandError = (message: string) => {
  errorMessage.value = message
  errorModalState.show()
}
</script>

<template>
  <template v-if="prefetchResult.error">
    <div
      class="flex gap-2 justify-between items-center pt-2 pl-2 pr-1.5 pb-1.5 font-code text-sm border rounded break-words mt-4 w-full">
      <div class="flex flex-1 gap-2">
        <ScalarIcon
          class="text-red flex-shrink-0"
          icon="Error"
          size="sm" />
        <div class="break-all line-clamp-4 w-full">
          {{ prefetchResult.error.slice(0, 100) }}...
        </div>
      </div>
      <span
        class="bg-b-2 cursor-pointer inline-block self-end px-1.5 py-1 rounded text-xs"
        @click="handleExpandError(prefetchResult.error)">
        Expand
      </span>
    </div>
  </template>
</template>
