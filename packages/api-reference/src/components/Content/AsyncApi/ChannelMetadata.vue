<script setup lang="ts">
import { ScalarCopy } from '@scalar/components/copy'
import { computed } from 'vue'

import OperationPath from '@/components/OperationPath.vue'
import { useLocalization } from '@/features/localization'

const { address } = defineProps<{ address?: string | null }>()
const { translate } = useLocalization()
const displayAddress = computed(
  (): string => address ?? translate('asyncapi.unknownAddress'),
)
</script>

<template>
  <div class="min-w-0 space-y-3 text-left text-sm">
    <dl class="space-y-3">
      <dt class="text-c-1 border-b pb-2 text-base leading-[1.45] font-medium">
        {{ translate('asyncapi.address') }}
      </dt>
      <dd class="group/address flex items-center gap-2">
        <code
          class="font-code min-w-0 text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
          <OperationPath
            class="text-c-1 [&_em]:text-c-2 font-normal! [&_em]:font-medium [&_em]:not-italic"
            :path="displayAddress" />
        </code>
        <ScalarCopy
          v-if="address != null"
          class="m-0 shrink-0 opacity-0 group-hover/address:opacity-100 focus-visible:opacity-100"
          :content="address">
          <template #copy>Copy address</template>
        </ScalarCopy>
      </dd>
    </dl>
  </div>
</template>
