<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { useMagicKeys, whenever } from '@vueuse/core'
import { useMediaQuery } from '@vueuse/core'
import { ref, watch } from 'vue'

import { useRequestStore } from '../../stores'
import HttpMethod from '../HttpMethod.vue'
import AddressBar from './AddressBar.vue'
import { Request } from './Request'
import { Response } from './Response'

const props = withDefaults(
  defineProps<{
    proxyUrl?: string
    readOnly?: boolean
    theme?: ThemeId
  }>(),
  {
    readOnly: false,
  },
)

const emit = defineEmits<{
  (e: 'escapeKeyPress'): void
}>()

const keys = useMagicKeys()
whenever(keys.escape, () => emit('escapeKeyPress'))

const { activeRequest, readOnly: stateReadOnly } = useRequestStore()

const isSmallScreen = useMediaQuery('(max-width: 820px)')

const selectedTab = ref(0)

const Tabs = {
  Request: 0,
  Response: 1,
}

function changeTab(index: number) {
  selectedTab.value = index
}

watch(
  () => props.readOnly,
  () => {
    stateReadOnly.value = props.readOnly
  },
  { immediate: true },
)
</script>

<template>
  <ThemeStyles :id="theme" />
  <HttpMethod
    class="scalar-api-client"
    :method="activeRequest.type ?? 'get'"
    property="--default-scalar-api-client-color"
    @keydown.esc="emit('escapeKeyPress')">
    <AddressBar
      :proxyUrl="proxyUrl"
      @onSend="changeTab(Tabs.Response)" />
    <div class="scalar-api-client__main">
      <!-- Desktop-->
      <template v-if="!isSmallScreen">
        <Request />
        <Response />
      </template>
      <!-- Mobile-->
      <template v-else>
        <TabGroup
          :selectedIndex="selectedTab"
          @change="changeTab">
          <TabList class="scalar-api-client__mobile-navigation">
            <Tab
              v-slot="{ selected }"
              class="scalar-api-client__mobile-navigation__toggle">
              <span
                :class="{
                  'scalar-api-client__mobile-navigation--active': selected,
                }">
                Request
              </span>
            </Tab>
            <Tab
              v-slot="{ selected }"
              class="scalar-api-client__mobile-navigation__toggle">
              <span
                :class="{
                  'scalar-api-client__mobile-navigation--active': selected,
                }">
                Response
              </span>
            </Tab>
          </TabList>
          <TabPanels as="template">
            <TabPanel as="template">
              <Request />
            </TabPanel>
            <TabPanel as="template">
              <Response />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </template>
    </div>
  </HttpMethod>
</template>

<style>
.scalar-api-client,
#headlessui-portal-root {
  background: var(--theme-background-1, var(--default-theme-background-1));
  position: relative;
  height: 100%;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
  font-family: var(--theme-font, var(--default-theme-font));

  /** Make sure box-sizing is set properly. */
  box-sizing: border-box;

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }
}
.scalar-api-client {
  flex: 1;
  max-height: 100vh;
}
@media screen and (max-width: 1000px) {
  .scalar-api-client {
    width: 100%;
  }
}
.scalar-api-client pre {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.scalar-api-client__mobile-navigation {
  padding: 12px 12px 0 12px;
  display: flex;
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-bold, var(--default-theme-bold));
}

.scalar-api-client__mobile-navigation__toggle {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--theme-font-size-2);
  color: var(--theme-color-2);
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-family: var(--theme-font, var(--default-theme-font));
  padding: 0;
  margin-right: 9px;
  cursor: pointer;
}

.scalar-api-client__mobile-navigation--active {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.scalar-api-client__mobile-navigation--active:hover {
  cursor: pointer;
}

.scalar-api-client__main {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

@media screen and (max-width: 820px) {
  .scalar-api-client__main {
    flex-direction: column;
  }
}

/** TODO: Consider to make a Column component */
.scalar-api-client__main__content {
  padding: 12px 6px;
  background: var(--theme-background-1, var(--default-theme-background-1));
  top: 0;
  position: sticky;
  z-index: 100;
}
.scalar-api-client__main__content label {
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  display: flex;
  align-items: center;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__content {
    padding: 3px 0 12px 0;
  }

  .scalar-api-client__main__content label {
    display: none;
  }
}

.meta {
  display: flex;
  margin-top: 3px;
  font-size: var(--theme-font-size-2, var(--default-theme-font-size-2));
  font-weight: var(--theme-font-size-2, var(--default-theme-font-size-2));
  color: var(
    --scalar-api-client-color2,
    var(--default-scalar-api-client-color2)
  );
}

.meta-item svg {
  fill: var(--theme-color-ghost, var(--default-theme-color-ghost));
  height: 14px;
  width: 14px;
  margin-right: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 12px;
  white-space: nowrap;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-3, var(--default-theme-color-3));
  min-height: 17px;
}

.meta-item__input {
  background: transparent;
  width: 100%;
  margin-right: 0;
}

.types {
  margin: auto;
  width: 580px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: wrap;
}

.types-heading {
  width: 100%;
  text-align: center;
}

.types-heading b {
  font-size: 42px;
}
.types-heading p {
  margin-bottom: 20px;
  margin-top: 12px;
  font-size: 24px;
}
.scalar-api-client__empty-state {
  border: 1px dashed
    var(--theme-border-color, var(--default-theme-border-color));
  width: 100%;
  text-align: center;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-size: var(--theme-small, var(--default-theme-small));
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
