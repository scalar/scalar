<script lang="ts" setup>
import {
  ScalarButton,
  ScalarFormSection,
  ScalarTextInput,
} from '@scalar/components'
import type { ApiReferenceConfiguration } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { ref } from 'vue'

import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'

const { configuration } = defineProps<{
  store: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
}>()

const url = ref('')

async function handleGenerateLink() {
  const data = encodeURIComponent(JSON.stringify(configuration))
  url.value = `https://editor.scalar.com/preview?config=${data}`
}
</script>
<template>
  <ApiReferenceToolbarPopover class="w-100">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ScalarButton
        variant="outlined"
        @click="handleGenerateLink">
        Generate
      </ScalarButton>
      <ScalarTextInput
        readonly
        :modelValue="url" />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
