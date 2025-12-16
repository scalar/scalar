<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'

import { OperationCodeSample } from '@/v2/blocks/operation-code-sample'
import type { OperationCodeSampleProps } from '@/v2/blocks/operation-code-sample/components/OperationCodeSample.vue'
import { CollapsibleSection } from '@/v2/components/layout'

const props = defineProps<OperationCodeSampleProps>()
</script>

<template>
  <CollapsibleSection :defaultOpen="false">
    <template #title>Code Snippet</template>
    <template #actions>
      <div
        class="text-c-2 request-meta-buttons flex whitespace-nowrap opacity-0 group-hover/params:opacity-100 has-[:focus-visible]:opacity-100"></div>
    </template>
    <ScalarErrorBoundary>
      <OperationCodeSample
        v-bind="props"
        simpleView />
    </ScalarErrorBoundary>
  </CollapsibleSection>
</template>
