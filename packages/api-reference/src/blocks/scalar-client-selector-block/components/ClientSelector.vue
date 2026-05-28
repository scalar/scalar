<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import {
  DEFAULT_CLIENT,
  findClient,
  generateCustomId,
  getClients,
  type ClientOption,
  type ClientOptionGroup,
  type CustomClientOption,
} from '@scalar/api-client/blocks/operation-code-sample'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AvailableClient } from '@scalar/snippetz'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import {
  getFeaturedClients,
  isFeaturedClient,
} from '@/blocks/scalar-client-selector-block/helpers/featured-clients'

import ClientDropdown from './ClientDropdown.vue'

const {
  clientOptions,
  xScalarSdkInstallation,
  xCodeSamples,
  eventBus,
  selectedClient = DEFAULT_CLIENT,
} = defineProps<{
  /** Selected SDK installation instructions */
  xScalarSdkInstallation?: XScalarSdkInstallation['x-scalar-sdk-installation']
  /** Custom code samples from the info object (x-codeSamples, x-code-samples, or x-custom-examples) */
  xCodeSamples?: XCodeSample[]
  /** Computed list of all available Http Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client */
  selectedClient?: AvailableClient
  /** Event bus */
  eventBus: WorkspaceEventBus
}>()

const headingId = useId()
const morePanel = useId()

/** Merge custom code samples with the client options */
const mergedClientOptions = computed(() =>
  getClients(xCodeSamples ?? [], clientOptions),
)

/** The locally selected client which includes custom code samples */
const localSelectedClient = ref<ClientOption | CustomClientOption | undefined>(
  findClient(mergedClientOptions.value, selectedClient),
)

/** If the globally selected client changes, update the local one */
watch(
  () => selectedClient,
  (newClient) => {
    const client = findClient(mergedClientOptions.value, newClient)
    if (client) {
      localSelectedClient.value = client
    }
  },
)

/** Grab the option for the currently selected Http Client */
const selectedClientOption = computed(
  () =>
    clientOptions.flatMap(
      (optionGroup) =>
        optionGroup.options.find(
          (option) => option.id === localSelectedClient.value?.id,
        ) ?? [],
    )[0],
)

/** List of featured clients */
const featuredClients = computed(() => getFeaturedClients(clientOptions))

/** Currently selected tab index */
const tabIndex = computed(() =>
  featuredClients.value.findIndex(
    (featuredClient) => localSelectedClient.value?.id === featuredClient.id,
  ),
)

const wrapper = useTemplateRef('wrapper-ref')

/** Emit the selected client event on tab */
const onTabSelect = (i: number) => {
  const client = featuredClients.value[i]

  if (!client || !wrapper.value) {
    return
  }

  localSelectedClient.value = client
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
    const targetKey = localSelectedClient.value?.id
      ?.split('/')[0]
      ?.toLowerCase()
    return instruction.lang.toLowerCase() === targetKey
  })

  // Nothing found?
  if (!instruction) {
    return undefined
  }

  // Got it!
  return instruction
})

/** Find the selected custom code sample when a custom client is selected */
const selectedCodeSample = computed(() => {
  if (!xCodeSamples?.length || !localSelectedClient.value?.id) {
    return undefined
  }

  // Check if the selected client is a custom sample
  if (localSelectedClient.value.id.startsWith('custom')) {
    const index = xCodeSamples.findIndex(
      (_, idx) => generateCustomId(idx) === localSelectedClient.value?.id,
    )
    if (index !== -1) {
      return xCodeSamples[index]
    }
  }

  return undefined
})

/** Check if the current selection is a custom code sample */
const isCustomSampleSelected = computed(() =>
  localSelectedClient.value?.id?.startsWith('custom'),
)

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
          :clientOptions="mergedClientOptions"
          :eventBus
          :featuredClients
          :localSelectedClient
          :morePanel
          :selectedClient="localSelectedClient?.id"
          :xCodeSamples
          @update:localSelectedClient="localSelectedClient = $event" />
      </TabList>

      <!-- Content -->
      <TabPanels>
        <!-- x-codeSamples: Display custom code samples when selected from dropdown -->
        <template v-if="isCustomSampleSelected && selectedCodeSample?.source">
          <div
            class="selected-client card-footer border-t-0 p-0"
            role="tabpanel"
            tabindex="0">
            <ScalarCodeBlock
              class="rounded-b-lg *:first:p-3"
              :content="selectedCodeSample.source"
              copy="always"
              :lang="selectedCodeSample.lang || 'plaintext'" />
          </div>
        </template>
        <!-- x-scalar-sdk-installation: Display SDK installation instructions -->
        <template
          v-else-if="
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
        <template
          v-else-if="
            !localSelectedClient?.id?.startsWith('custom') &&
            isFeaturedClient(localSelectedClient?.id as AvailableClient)
          ">
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
          {{ selectedClientOption?.title ?? localSelectedClient?.title }}
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
  border-bottom-left-radius: var(--scalar-radius-xl);
  border-bottom-right-radius: var(--scalar-radius-xl);
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
  border-top-left-radius: var(--scalar-radius-xl);
  border-top-right-radius: var(--scalar-radius-xl);
}
:deep(.scalar-codeblock-pre .hljs) {
  margin-top: 8px;
}
</style>
