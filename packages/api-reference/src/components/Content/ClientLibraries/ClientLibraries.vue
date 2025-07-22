<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { useWorkspace } from '@scalar/api-client/store'
import { ScalarCodeBlock, ScalarMarkdown } from '@scalar/components'
import type { AvailableClients } from '@scalar/snippetz'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { computed, ref, useId, watch } from 'vue'

import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

// import ClientSelector from './ClientSelector.vue'
import { getFeaturedClients, isFeaturedClient } from './featured-clients'

const { clientOptions, selectedClient } = defineProps<{
  /** Computed list of all available Http Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client */
  selectedClient?: AvailableClients[number]
}>()

console.log('clientOptions', clientOptions)
const { collections } = useWorkspace()

const index = ref(0)
const headingId = useId()
const morePanel = useId()

/** Grab the option for the currently selected Http Client */
const selectedClientOption = computed(
  () =>
    clientOptions.flatMap(
      (option) =>
        option.options.find((option) => option.id === selectedClient) ?? [],
    )[0],
)

console.log('selectedClientOption', selectedClientOption.value)

const featuredClients = computed(() => getFeaturedClients(clientOptions))

// Update the correct tab index
// watch(
//   () => store.workspace.activeDocument?.['x-scalar-default-client'],
//   (client) => {
//     if (!client) {
//       return
//     }

//     index.value = featuredClients.findIndex(
//       (tab) =>
//         tab.targetKey === client.targetKey &&
//         tab.clientKey === client.clientKey,
//     )
//   },
//   { immediate: true },
// )

function handleChange(i: number) {
  // const tab = featuredClients[i]
  // if (!tab) {
  //   return
  // }
  // setHttpClient(tab)
}

const installationInstructions = computed(() => {
  // Get the current collection from the store
  const firstCollection = Object.values(collections)[0]

  // Get instructions (if we have any)
  const XScalarSdkInstallation =
    firstCollection?.info?.['x-scalar-sdk-installation']

  // Check whether we have instructions at all
  if (
    !Array.isArray(XScalarSdkInstallation) ||
    !XScalarSdkInstallation?.length
  ) {
    return undefined
  }

  // Find the instructions for the current language
  const instruction = XScalarSdkInstallation.find((instruction) => {
    const targetKey = selectedClient?.split('/')[0]?.toLowerCase()
    return instruction.lang.toLowerCase() === targetKey
  })

  // Nothing found?
  if (!instruction) {
    return undefined
  }

  // Got it!
  return instruction
})
</script>
<template>
  <div v-if="clientOptions.length">
    <TabGroup
      manual
      :selectedIndex="index"
      @change="handleChange">
      <div
        :id="headingId"
        class="client-libraries-heading">
        Client Libraries
      </div>
      <TabList
        :aria-labelledby="headingId"
        class="client-libraries-list">
        <!-- <ClientSelector
          :featured="featuredClients"
          :morePanel="morePanel" /> -->
      </TabList>
      <TabPanels>
        <template
          v-if="
            installationInstructions?.source ||
            installationInstructions?.description
          ">
          <div
            v-if="installationInstructions.description"
            class="selected-client card-footer -outline-offset-2"
            :class="installationInstructions.source && 'rounded-b-none'"
            role="tabpanel"
            tabindex="0">
            <ScalarMarkdown :value="installationInstructions.description" />
          </div>
          <div
            v-if="installationInstructions.source"
            class="selected-client card-footer border-t-0 p-0"
            role="tabpanel"
            tabindex="1">
            <ScalarCodeBlock
              lang="shell"
              :content="installationInstructions.source"
              :copy="true"
              class="rounded-t-none rounded-b-lg px-3 py-2 -outline-offset-1 has-focus:outline" />
          </div>
        </template>
        <template v-else-if="isFeaturedClient(selectedClient)">
          <TabPanel
            v-for="client in featuredClients"
            :key="client.id"
            class="selected-client card-footer -outline-offset-2">
            {{ client.title }}
          </TabPanel>
        </template>
        <div
          v-else
          :id="morePanel"
          class="selected-client card-footer -outline-offset-2"
          role="tabpanel"
          tabindex="0">
          {{ selectedClientOption?.title }}
        </div>
      </TabPanels>
    </TabGroup>
  </div>
</template>
<style scoped>
.selected-client {
  color: var(--scalar-color-1);
  font-size: var(--scalar-small);
  font-family: var(--scalar-font-code);
  padding: 9px 12px;
  border-top: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--scalar-background-1);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom-left-radius: var(--scalar-radius-lg);
  border-bottom-right-radius: var(--scalar-radius-lg);
  min-height: fit-content;
}
.client-libraries-heading {
  font-size: var(--scalar-small);
  font-weight: var(--scalar-font-medium);
  color: var(--scalar-color-1);
  padding: 9px 12px;
  background-color: var(--scalar-background-2);
  display: flex;
  align-items: center;
  max-height: 32px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-top-left-radius: var(--scalar-radius-lg);
  border-top-right-radius: var(--scalar-radius-lg);
}
:deep(.scalar-codeblock-pre .hljs) {
  margin-top: 8px;
}
</style>
