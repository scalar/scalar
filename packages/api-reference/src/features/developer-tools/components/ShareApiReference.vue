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
      <template #label>Your Temporary Link</template>
      <ApiReferenceToolbarShareTemporary :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
