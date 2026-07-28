<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import {
  DEFAULT_CLIENT,
  type ClientOptionGroup,
} from '@scalar/blocks/code-example'
import { ScalarIcon } from '@scalar/components/icon'
import type { TargetId } from '@scalar/types/snippetz'
import { type WorkspaceEventBus } from '@scalar/workspace-store/events'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import {
  getFeaturedClients,
  isFeaturedClient,
} from '@/blocks/scalar-client-selector-block/helpers/featured-clients'
import { useLocalization } from '@/features/localization'

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
const { translate } = useLocalization()

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
  featuredClients.value.findIndex((client) => client.id === activeClient.value),
)

const wrapper = useTemplateRef('wrapper-ref')

const getIconByLanguageKey = (targetKey: TargetId) =>
  `programming-language-${targetKey === 'js' ? 'javascript' : targetKey}` as const

/** Handle tab selection */
const onTabSelect = (index: number) => {
  const client = featuredClients.value[index]

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

      <!--
        TabList may only contain Tab children (aria-required-children).
        The "More" combobox sits beside it in the same visual row.
      -->
      <div class="client-libraries-list">
        <TabList
          :aria-labelledby="headingId"
          class="client-libraries-tabs">
          <Tab
            v-for="featuredClient in featuredClients"
            :key="featuredClient.clientKey"
            class="client-libraries rendered-code-sdks"
            :class="{
              'client-libraries__active': featuredClient.id === activeClient,
            }">
            <div :class="`client-libraries-icon__${featuredClient.targetKey}`">
              <ScalarIcon
                class="client-libraries-icon"
                :icon="getIconByLanguageKey(featuredClient.targetKey)" />
            </div>
            <span class="client-libraries-text">{{
              featuredClient.targetTitle
            }}</span>
          </Tab>
        </TabList>

        <ClientDropdown
          :clientOptions
          :eventBus
          :selectedClient="activeClient" />
      </div>

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
.client-libraries-list {
  container: client-libraries-list / inline-size;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 0 12px;
  background-color: var(--scalar-background-1);
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
}
.client-libraries-tabs {
  display: flex;
  flex: 1;
  min-width: 0;
}
.client-libraries {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 2px;
  gap: 6px;
  color: var(--scalar-color-3);
  border-bottom: 1px solid transparent;
  user-select: none;
}

.client-libraries:not(.client-libraries__active):hover:before {
  content: '';
  position: absolute;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background: var(--scalar-background-2);
  left: 2px;
  top: 2px;
  z-index: 0;
  border-radius: var(--scalar-radius);
}
.client-libraries:active {
  color: var(--scalar-color-1);
}
.client-libraries:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--scalar-color-accent);
}
/* remove php and c on mobile */
@media screen and (max-width: 450px) {
  .client-libraries:nth-of-type(4),
  .client-libraries:nth-of-type(5) {
    display: none;
  }
}
.client-libraries-icon {
  max-width: 14px;
  max-height: 14px;
  min-width: 14px;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  color: currentColor;
}
.client-libraries__active {
  color: var(--scalar-color-1);
  border-bottom: 1px solid var(--scalar-color-1);
}
.client-libraries .client-libraries-text {
  font-size: var(--scalar-small);
  position: relative;
  display: flex;
  align-items: center;
}
.client-libraries__active .client-libraries-text {
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}
@media screen and (max-width: 600px) {
  .references-classic .client-libraries {
    flex-direction: column;
  }
}
@container client-libraries-list (width < 380px) {
  .client-libraries {
    width: 100%;
  }
  .client-libraries span {
    display: none;
  }
}
</style>
