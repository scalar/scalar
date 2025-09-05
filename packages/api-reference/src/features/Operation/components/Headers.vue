<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { HeaderObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import Header from './Header.vue'

const { headers, breadcrumb } = defineProps<{
  headers: Record<string, HeaderObject>
  breadcrumb?: string[]
}>()
</script>
<template>
  <Disclosure v-slot="{ open }">
    <div
      class="headers-card headers-card--compact"
      :class="[{ 'headers-card--open': open }]">
      <div
        class="headers-properties"
        :class="{ 'headers-properties-open': open }">
        <DisclosureButton
          class="headers-card-title headers-card-title--compact"
          :style="{
            top: `calc(var(--refs-header-height)))`,
          }">
          <ScalarIcon
            class="headers-card-title-icon"
            :class="{ 'headers-card-title-icon--open': open }"
            icon="Add"
            size="sm" />
          <template v-if="open"> Hide Headers </template>
          <template v-else> Show Headers </template>
        </DisclosureButton>
        <DisclosurePanel>
          <template
            v-for="(header, key) in headers"
            :key="key">
            <Header
              :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
              :header="getResolvedRef(header)"
              :name="key" />
          </template>
        </DisclosurePanel>
      </div>
    </div>
  </Disclosure>
</template>
<style scoped>
.headers-card {
  z-index: 0;
  margin-top: 12px;
  margin-bottom: 6px;
  position: relative;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-1);

  align-self: flex-start;
}
.headers-card.headers-card--open {
  align-self: initial;
}
.headers-card-title {
  padding: 6px 10px;

  display: flex;
  align-items: center;
  gap: 4px;

  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-micro);

  border-radius: 13.5px;
}
button.headers-card-title {
  cursor: pointer;
}
button.headers-card-title:hover {
  color: var(--scalar-color-1);
}
.headers-card-title-icon--open {
  transform: rotate(45deg);
}
.headers-properties {
  display: flex;
  flex-direction: column;

  border: var(--scalar-border-width) solid var(--scalar-border-color);

  border-radius: 13.5px;
  width: fit-content;
}
.headers-properties-open > .headers-card-title {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.headers-properties-open {
  border-radius: var(--scalar-radius-lg);
  width: 100%;
}
.headers-card .property:last-of-type {
  padding-bottom: 10px;
}
.headers-card-title > .headers-card-title-icon {
  width: 10px;
  height: 10px;
  margin: 0;
}
.headers-card-title > .headers-card-title-icon--open {
  transform: rotate(45deg);
}
</style>
