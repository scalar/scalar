<script setup lang="ts">
import { TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { ref, useId, watch } from 'vue'

import { useHttpClientStore } from '../../../stores'
import ClientSelector from './ClientSelector.vue'
import { useFeaturedHttpClients } from './useFeaturedHttpClients'

const {
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
  getClientTitle,
  getTargetTitle,
  httpClient,
  setHttpClient,
} = useHttpClientStore()
const { featuredClients, isFeatured } = useFeaturedHttpClients()

const index = ref(0)
const headingId = useId()
const morePanel = useId()

watch(
  httpClient,
  (client) => {
    if (!client) return

    console.log('is featured', client, featuredClients)
    index.value = featuredClients.findIndex(
      (tab) =>
        tab.targetKey === client.targetKey &&
        tab.clientKey === client.clientKey,
    )
  },
  { immediate: true },
)

function handleChange(i: number) {
  const tab = featuredClients[i]
  if (!tab) return
  setHttpClient(tab)
}
</script>
<template>
  <div v-if="availableTargets.length">
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
        <ClientSelector
          :featured="featuredClients"
          :morePanel="morePanel" />
      </TabList>
      <TabPanels>
        <template v-if="httpClient && isFeatured(httpClient)">
          <TabPanel
            v-for="(client, i) in featuredClients"
            :key="i"
            class="selected-client card-footer -outline-offset-2">
            {{ getClientTitle(client) }}
            {{ getTargetTitle(client) }}
          </TabPanel>
        </template>
        <div
          v-else
          :id="morePanel"
          class="selected-client card-footer -outline-offset-2"
          role="tabpanel"
          tabindex="0">
          {{ httpClientTitle }}
          {{ httpTargetTitle }}
        </div>
      </TabPanels>
    </TabGroup>
  </div>
</template>
<style scoped>
.selected-client {
  color: var(--scalar-color-1);
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font-code);
  padding: 9px 12px;
  border-top: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--scalar-background-1);
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  min-height: fit-content;
}
.client-libraries-heading {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-1);
  padding: 9px 12px;
  background-color: var(--scalar-background-2);
  display: flex;
  align-items: center;
  max-height: 32px;
}
</style>
