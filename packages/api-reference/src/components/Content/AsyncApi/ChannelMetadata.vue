<script setup lang="ts">
import { useLocalization } from '@/features/localization'

const { address, summary } = defineProps<{
  address?: string | null
  summary?: string
}>()
const { translate } = useLocalization()
</script>

<template>
  <div class="mb-3 min-w-0 text-left">
    <dl class="text-c-2 flex flex-wrap gap-x-2 text-sm">
      <dt>{{ translate('asyncapi.address') }}:</dt>
      <dd
        class="text-c-1 font-code min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {{ address ?? translate('asyncapi.unknownAddress') }}
      </dd>
    </dl>
    <p
      v-if="summary?.trim()"
      class="text-c-1 mt-3 [overflow-wrap:anywhere]">
      {{ summary }}
    </p>
  </div>
</template>
