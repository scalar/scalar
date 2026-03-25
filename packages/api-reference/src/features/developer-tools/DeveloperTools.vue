<script lang="ts" setup>
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type {
  ApiReferenceConfiguration,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed } from 'vue'

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

const showDeveloperTools = computed<boolean>(() => {
  if (configuration?.showDeveloperTools === 'always') {
    return true
  }

  if (configuration?.showDeveloperTools === 'never') {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return isLocalUrl(window.location.href)
})
</script>
<template>
  <header
    v-if="showDeveloperTools"
    aria-label="Developer Tools"
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
