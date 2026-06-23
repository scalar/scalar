<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components/form'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useApiReferenceI18n } from '@/features/i18n'

import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarShareRegister from './ApiReferenceToolbarShareRegister.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()
const { translate } = useApiReferenceI18n()
</script>

<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>{{ translate('developerTools.deploy') }}</template>
    <ScalarFormSection>
      <template #label>{{ translate('developerTools.scalarDocs') }}</template>
      <p class="text-c-2 mb-2 leading-normal">
        {{ translate('developerTools.deployDescription') }}
      </p>
      <ApiReferenceToolbarShareRegister
        :externalUrls
        :workspace />
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
