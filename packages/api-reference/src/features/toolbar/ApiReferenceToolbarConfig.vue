<script lang="ts" setup>
import { ScalarCodeBlock, ScalarFormSection } from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'

import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

defineProps<{
  configuration?: Partial<ApiReferenceConfiguration>
}>()
</script>
<template>
  <ApiReferenceToolbarPopover>
    <template #label> Configure </template>
    <ScalarFormSection>
      <template #label>Scalar Configuration</template>
      <ScalarCodeBlock
        class="bg-b-1.5 max-h-40 rounded border text-sm"
        :content="JSON.stringify(configuration, null, 2)"
        lang="json" />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
