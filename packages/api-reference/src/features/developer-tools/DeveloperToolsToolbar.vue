<script lang="ts" setup>
import type {
  ApiReferenceConfiguration,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useLocalization } from '@/features/localization'

import ApiReferenceToolbarTitle from './components/ApiReferenceToolbarTitle.vue'
import DeployApiReference from './components/DeployApiReference.vue'
import ModifyConfiguration from './components/ModifyConfiguration.vue'
import ShareApiReference from './components/ShareApiReference.vue'

const { configuration, externalUrls } = defineProps<{
  workspace?: WorkspaceStore
  configuration?: Partial<ApiReferenceConfiguration>
  externalUrls: ExternalUrls
}>()

const overrides = defineModel<Partial<ApiReferenceConfiguration>>('overrides')
const { translate } = useLocalization()
</script>
<template>
  <header
    :aria-label="translate('developerTools.title')"
    class="api-reference-toolbar bg-b-1 relative z-1 flex h-10 justify-center border-b px-15">
    <div
      class="-mx-2 flex max-w-(--refs-content-max-width) flex-1 items-center">
      <div class="flex flex-1 items-center">
        <ApiReferenceToolbarTitle />
      </div>
      <ModifyConfiguration
        v-model:overrides="overrides"
        :configuration />
      <template v-if="workspace">
        <ShareApiReference
          :externalUrls
          :workspace />
        <DeployApiReference
          :externalUrls
          :workspace />
      </template>
    </div>
  </header>
</template>
