<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { ScalarCodeBlock, ScalarMarkdown } from '@scalar/components'
import type { AvailableClients } from '@scalar/snippetz'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { computed, useId, useTemplateRef } from 'vue'

import { DEFAULT_CLIENT } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import ClientSelector from './ClientSelector.vue'
import { getFeaturedClients, isFeaturedClient } from './featured-clients'

const {
  clientOptions,
  document,
  selectedClient = DEFAULT_CLIENT,
} = defineProps<{
  /** Current document from the store */
  document: WorkspaceDocument
  /** Computed list of all available Http Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client */
  selectedClient?: AvailableClients[number]
}>()

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

/** List of featured clients */
const featuredClients = computed(() => getFeaturedClients(clientOptions))

/** Currently selected tab index */
const tabIndex = computed(() =>
  featuredClients.value.findIndex(
    (featuredClient) => selectedClient === featuredClient.id,
  ),
)

const wrapper = useTemplateRef('wrapper-ref')

/** Emit the selected client event on tab */
const onTabSelect = (i: number) => {
  const client = featuredClients.value[i]

  if (!client || !wrapper.value) {
    return
  }

  emitCustomEvent(wrapper.value, 'scalar-update-selected-client', client.id)
}

const installationInstructions = computed(() => {
  // Get instructions (if we have any)
  const XScalarSdkInstallation = document.info['x-scalar-sdk-installation']

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

defineExpose({
  selectedClientOption,
})
</script>
<template>
  <div
    v-if="clientOptions.length"
    ref="wrapper-ref">
    <TabGroup
      manual
      :selectedIndex="tabIndex"
      @change="onTabSelect">
      <div
        :id="headingId"
        class="client-libraries-heading">
        Client Libraries
      </div>

      <!-- Tabs -->
      <TabList
        :aria-labelledby="headingId"
        class="client-libraries-list">
        <ClientSelector
          :clientOptions
          :featuredClients
          :morePanel
          :selectedClient />
      </TabList>

      <!-- Content -->
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
              class="rounded-t-none rounded-b-lg px-3 py-2 -outline-offset-1 has-focus:outline"
              :content="installationInstructions.source"
              :copy="true"
              lang="shell" />
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
