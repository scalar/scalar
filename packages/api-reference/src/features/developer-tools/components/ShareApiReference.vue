<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareTemporary from './ApiReferenceToolbarShareTemporary.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
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
      <ApiReferenceToolbarShareTemporary
        :externalUrls
        :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
