<script setup lang="ts">
import { OpenApiClientButton } from '@/components'
import AddressBar from '@/components/AddressBar/AddressBar.vue'
import SidebarToggle from '@/components/Sidebar/SidebarToggle.vue'
import { useLayout } from '@/hooks'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarIcon } from '@scalar/components'
import { useRouter } from 'vue-router'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'hideModal'): void
  (e: 'importCurl', value: string): void
}>()

const { activeCollection } = useActiveEntities()
const { hideClientButton, showSidebar, integration } = useWorkspace()

const { layout } = useLayout()
const { currentRoute } = useRouter()
</script>
<template>
  <div
    class="lg:min-h-client-header flex items-center w-full justify-center p-2 pt-2 lg:pt-1 lg:p-1 flex-wrap t-app__top-container border-b-1/2">
    <div
      class="flex flex-row items-center gap-1 lg:px-1 lg:mb-0 mb-2 lg:flex-1 w-1/2">
      <SidebarToggle
        v-if="showSidebar"
        class="ml-1"
        :class="[
          { hidden: modelValue },
          { 'xl:!flex': !modelValue },
          { '!flex': layout === 'modal' },
          { '!hidden': layout === 'modal' && modelValue },
        ]"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)" />
    </div>
    <AddressBar @importCurl="$emit('importCurl', $event)" />
    <div
      class="flex flex-row items-center gap-1 lg:px-2.5 lg:mb-0 mb-2 lg:flex-1 justify-end w-1/2">
      <OpenApiClientButton
        v-if="
          layout === 'modal' &&
          activeCollection?.documentUrl &&
          !hideClientButton
        "
        buttonSource="modal"
        class="!w-fit lg:-mr-1"
        :integration="integration || activeCollection?.integration"
        :source="
          currentRoute.query.source === 'gitbook' ? 'gitbook' : 'api-reference'
        "
        :url="activeCollection?.documentUrl" />
      <!-- TODO: There should be an `ìsModal` flag instead -->
      <button
        v-if="layout === 'modal'"
        class="app-exit-button p-2 rounded-full fixed right-2 top-2 gitbook-hidden"
        type="button"
        @click="$emit('hideModal')">
        <ScalarIcon
          icon="Close"
          size="lg"
          thickness="2" />
        <span class="sr-only">Close Client</span>
      </button>
      <!-- TODO: temporary solution: 2nd button (not fixed position) for our friends at GitBook -->
      <button
        v-if="layout === 'modal'"
        class="text-c-1 hover:bg-b-2 active:text-c-1 p-2 rounded -mr-1.5 gitbook-show"
        type="button"
        @click="$emit('hideModal')">
        <ScalarIcon
          icon="Close"
          size="md"
          thickness="1.75" />
        <span class="sr-only">Close Client</span>
      </button>
    </div>
  </div>
</template>
<style scoped>
.gitbook-show {
  display: none;
}
.app-exit-button {
  color: white;
  background: rgba(0, 0, 0, 0.1);
}
.app-exit-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
