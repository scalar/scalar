<script setup lang="ts">
import { useKeyboardEvent } from '@anc/library'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { useMediaQuery } from '@vueuse/core'
import { ref } from 'vue'

import { useApiClientRequestStore } from '../../stores/apiClientRequestStore'
import AdressBar from './AddressBar.vue'
import { Request } from './Request'
import { Response } from './Response'

defineProps<{ proxyUrl: string }>()

const emit = defineEmits<{
  (e: 'escapeKeyPress'): void
}>()

const { activeRequest } = useApiClientRequestStore()

const isSmallScreen = useMediaQuery('(max-width: 820px)')

const selectedTab = ref(0)

const Tabs = {
  Request: 0,
  Response: 1,
}

function changeTab(index: number) {
  selectedTab.value = index
}

useKeyboardEvent({
  keyList: ['escape'],
  handler: () => emit('escapeKeyPress'),
})
</script>

<template>
  <div
    class="scalar-api-client"
    :class="`scalar-api-client--${activeRequest.type.toLowerCase() || 'get'}`"
    @keydown.esc="emit('escapeKeyPress')">
    <AdressBar
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
              <button
                :class="{
                  'scalar-api-client__mobile-navigation--active': selected,
                }"
                type="button">
                Request
              </button>
            </Tab>
            <Tab
              v-slot="{ selected }"
              class="scalar-api-client__mobile-navigation__toggle">
              <button
                :class="{
                  'scalar-api-client__mobile-navigation--active': selected,
                }"
                type="button">
                Response
              </button>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Request />
            </TabPanel>
            <TabPanel>
              <Response />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </template>
    </div>
  </div>
</template>

<style src="../../assets/css/variables.css"></style>

<style>
.scalar-api-client {
  width: calc(100% - var(--scalar-api-client-sidebar-width));
  background: var(--scalar-api-client-background-1);
  position: relative;
  height: 100%;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
}
@media screen and (max-width: 1000px) {
  .scalar-api-client {
    width: 100%;
  }
}
.scalar-api-client--post {
  --scalar-api-client-color: var(--scalar-api-client-post-color);
  --scalar-api-client-background: var(--scalar-api-client-post-background);
}

.scalar-api-client--delete {
  --scalar-api-client-color: var(--scalar-api-client-delete-color);
  --scalar-api-client-background: var(--scalar-api-client-delete-background);
}

.scalar-api-client--patch {
  --scalar-api-client-color: var(--scalar-api-client-patch-color);
  --scalar-api-client-background: var(--scalar-api-client-patch-background);
}

.scalar-api-client--get {
  --scalar-api-client-color: var(--scalar-api-client-get-color);
  --scalar-api-client-background: var(--scalar-api-client-get-background);
}

.scalar-api-client--put {
  --scalar-api-client-color: var(--scalar-api-client-put-color);
  --scalar-api-client-background: var(--scalar-api-client-put-background);
}

.scalar-api-client__mobile-navigation {
  padding: 12px 12px 0 12px;
  display: flex;
  font-size: var(--scalar-api-client-theme-small);
  color: var(--scalar-api-client-theme-color-2);
  font-weight: var(--scalar-api-client-theme-bold);
}

.scalar-api-client__mobile-navigation__toggle {
  appearance: none;
  margin-right: 9px;
  cursor: pointer;
}

.scalar-api-client__mobile-navigation--active {
  color: var(--scalar-api-client-theme-color-1);
}

.scalar-api-client__mobile-navigation--active:hover {
  cursor: pointer;
}

.scalar-api-client__main {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--scalar-api-client-background-1);
  border-top: var(--scalar-api-client-border);
}

@media screen and (max-width: 820px) {
  .scalar-api-client__main {
    display: block;
  }
}

/** TODO: Consider to make a Column component */
.scalar-api-client__main__content {
  padding: 12px;
  background: var(--scalar-api-client-background-1);
  top: 0;
  position: sticky;
  z-index: 100;
}
.scalar-api-client__main__content label {
  font-size: var(--scalar-api-client-theme-small);
  color: var(--scalar-api-client-theme-color-1);
  font-weight: var(--scalar-api-client-theme-bold);
  display: flex;
  align-items: center;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__content {
    padding: 0 0 12px 0;
  }

  .scalar-api-client__main__content label {
    display: none;
  }
}

.meta {
  display: flex;
  font-size: var(--scalar-api-client-theme-regular);
  font-weight: var(--scalar-api-client-normal);
  color: var(--scalar-api-client-color2);
}

.meta-item svg {
  fill: var(--scalar-api-client-fill);
  height: 14px;
  width: 14px;
  margin-right: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-right: 12px;
  white-space: nowrap;
  font-weight: var(--scalar-api-client-theme-bold);
  font-size: 12px;
  color: var(--scalar-api-client-color-3);
  padding: 3px 0;
}

.meta-item__input {
  padding: 3px 0;
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

.types-item {
  font-weight: var(--scalar-api-client-theme-bold);
  font-size: var(--scalar-api-client-large);
  color: var(--scalar-api-client-color2);
  background: var(--scalar-api-client-bg3);
  padding: 9px 18px;
  margin: 6px;
  border-radius: 30px;
}

.types-item:hover {
  box-shadow: 0 0 0 1px var(--scalar-api-client-border-color);
  background: var(--scalar-api-client-gradient);
  color: var(--scalar-api-client-theme-color-1);
  cursor: pointer;
}
</style>
