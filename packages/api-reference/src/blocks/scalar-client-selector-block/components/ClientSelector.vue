<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import {
  DEFAULT_CLIENT,
  type ClientOptionGroup,
} from '@scalar/api-client/v2/blocks/operation-code-sample'
import { ScalarCodeBlock, ScalarMarkdown } from '@scalar/components'
import type { AvailableClient } from '@scalar/snippetz'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'
import { computed, useId, useTemplateRef } from 'vue'

import {
  getFeaturedClients,
  isFeaturedClient,
} from '@/blocks/scalar-client-selector-block/helpers/featured-clients'

import ClientDropdown from './ClientDropdown.vue'

const {
  clientOptions,
  xScalarSdkInstallation,
  eventBus,
  selectedClient = DEFAULT_CLIENT,
} = defineProps<{
  /** Selected SDK installation instructions */
  xScalarSdkInstallation?: XScalarSdkInstallation['x-scalar-sdk-installation']
  /** Computed list of all available Http Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client */
  selectedClient?: AvailableClient
  /** Event bus */
  eventBus: WorkspaceEventBus
}>()

const headingId = useId()
const morePanel = useId()

/** Grab the option for the currently selected Http Client */
const selectedClientOption = computed(
  () =>
    clientOptions.flatMap(
      (optionGroup) =>
        optionGroup.options.find((option) => option.id === selectedClient) ??
        [],
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

  eventBus.emit('workspace:update:selected-client', client.id)
}

const installationInstructions = computed(() => {
  // Check whether we have instructions at all
  if (
    !Array.isArray(xScalarSdkInstallation) ||
    !xScalarSdkInstallation?.length
  ) {
    return undefined
  }

  // Find the instructions for the current language
  const instruction = xScalarSdkInstallation.find((instruction) => {
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
        <ClientDropdown
          :clientOptions
          :eventBus
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
              class="rounded-b-lg *:first:p-3"
              :content="installationInstructions.source"
              copy="always"
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
