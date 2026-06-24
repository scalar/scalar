<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import {
  DEFAULT_CLIENT,
  type ClientOptionGroup,
} from '@scalar/blocks/code-example'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import {
  getFeaturedClients,
  isFeaturedClient,
} from '@/blocks/scalar-client-selector-block/helpers/featured-clients'
import { useApiReferenceLocalization } from '@/features/localization'

import ClientDropdown from './ClientDropdown.vue'

const {
  clientOptions,
  eventBus,
  selectedClient = DEFAULT_CLIENT,
} = defineProps<{
  /** Computed list of all available Http Client options */
  clientOptions: ClientOptionGroup[]
  /** The currently selected Http Client (a built-in client id or a custom sample id) */
  selectedClient?: string
  /** Event bus */
  eventBus: WorkspaceEventBus
}>()

const headingId = useId()
const morePanel = useId()
const { translate } = useApiReferenceLocalization()

/**
 * Whether a selection is a custom code sample (e.g. `custom/python`) rather than
 * a built-in client. Custom samples are matched by the `custom/` id prefix, which
 * mirrors the `^custom/` pattern enforced on the stored default client.
 */
const isCustomSelection = (client: string | undefined) =>
  Boolean(client?.startsWith('custom/'))

/**
 * The generic client this selector actually displays.
 *
 * The introduction selector only represents the built-in HTTP clients. Custom
 * code samples are operation-specific and "always just have the generic
 * clients", so when one is selected globally we keep showing the last generic
 * client here instead of switching to (and failing to render) a custom sample.
 */
const activeClient = ref(
  isCustomSelection(selectedClient) ? DEFAULT_CLIENT : selectedClient,
)

watch(
  () => selectedClient,
  (newClient) => {
    if (!isCustomSelection(newClient)) {
      activeClient.value = newClient
    }
  },
)

/** Grab the option for the currently selected Http Client */
const selectedClientOption = computed(
  () =>
    clientOptions.flatMap(
      (optionGroup) =>
        optionGroup.options.find(
          (option) => option.id === activeClient.value,
        ) ?? [],
    )[0],
)

/** List of featured clients */
const featuredClients = computed(() => getFeaturedClients(clientOptions))

/** Currently selected tab index */
const tabIndex = computed(() =>
  featuredClients.value.findIndex(
    (featuredClient) => activeClient.value === featuredClient.id,
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
        {{ translate('clientLibraries.heading') }}
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
          :selectedClient="activeClient" />
      </TabList>

      <!-- Content -->
      <TabPanels>
        <template v-if="isFeaturedClient(activeClient)">
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
</style>
