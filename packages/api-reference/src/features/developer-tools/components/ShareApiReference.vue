<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components/form'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareTemporary from './ApiReferenceToolbarShareTemporary.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()
const { translate } = useLocalization()
</script>
<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>{{ translate('developerTools.share') }}</template>
    <ScalarFormSection>
      <template #label>{{ translate('developerTools.shareTitle') }}</template>
      <p class="text-c-2 mb-2 leading-normal">
        {{ translate('developerTools.shareDescription') }}
      </p>
      <ApiReferenceToolbarShareTemporary
        :externalUrls
        :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
