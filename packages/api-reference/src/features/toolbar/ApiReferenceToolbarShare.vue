<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarPopover from '@/features/toolbar/ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareRegister from '@/features/toolbar/ApiReferenceToolbarShareRegister.vue'
import ApiReferenceToolbarShareTemporary from '@/features/toolbar/ApiReferenceToolbarShareTemporary.vue'

const { workspace } = defineProps<{
  workspace: WorkspaceStore
}>()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Share</template>
    <ScalarFormSection>
      <template #label>Temporary Link</template>
      <ApiReferenceToolbarShareTemporary :workspace />
    </ScalarFormSection>
    <ScalarFormSection>
      <template #label>Cloud Hosting</template>
      <ApiReferenceToolbarShareRegister :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
