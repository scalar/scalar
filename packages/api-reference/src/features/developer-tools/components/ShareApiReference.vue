<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareTemporary from './ApiReferenceToolbarShareTemporary.vue'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Share your API Reference</template>
      <p class="text-c-2 mb-2 leading-normal">
        Upload your OpenAPI document to share your API Reference with others. As
        easy as pressing a button.
      </p>
      <ApiReferenceToolbarShareTemporary :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
