<script setup lang="ts">
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

const { address, summary } = defineProps<{
  address?: string | null
  summary?: string
}>()
const { translate } = useLocalization()

const displayAddress = computed(
  (): string => address ?? translate('asyncapi.unknownAddress'),
)
const hasSummary = computed((): boolean => Boolean(summary?.trim()))
const descriptionSpacingClass = computed((): string =>
  hasSummary.value ? 'mb-2' : 'mb-4',
)
</script>

<template>
  <div
    class="min-w-0 text-left"
    :class="descriptionSpacingClass">
    <dl class="text-c-2 flex flex-wrap items-baseline gap-x-2 leading-[1.625]">
      <dt>{{ translate('asyncapi.address') }}:</dt>
      <dd
        class="font-code min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">
        {{ displayAddress }}
      </dd>
    </dl>
    <p
      v-if="hasSummary"
      class="text-c-1 mt-4 [overflow-wrap:anywhere]">
      {{ summary }}
    </p>
  </div>
</template>
