<script setup lang="ts">
import {
  ScalarIcon,
  ScalarModal,
  ScalarSearchInput,
  type ModalState,
} from '@scalar/components'
import { computed } from 'vue'

import { useSearch } from '@/hooks/use-search'
import { useState } from '@/state/state'

defineProps<{
  modal: ModalState
}>()

const search = useSearch()

const state = useState()

const searchOptions = computed(() =>
  search.results.value
    .filter((r) => {
      return !state.registryDocuments.value.some(
        (d) => d.namespace === r.namespace && d.slug === r.slug,
      )
    })
    .map((result) => ({
      ...result,
      label: result.title,
      id: result.id,
    })),
)
</script>

<template>
  <ScalarModal
    class="catalogModal"
    :state="modal">
    <ScalarSearchInput
      autofocus
      class="searchInput"
      :modelValue="search.query.value"
      @update:modelValue="(v) => (search.query.value = v ?? '')" />
    <template v-if="searchOptions.length">
      <div class="catalog custom-scroll">
        <button
          v-for="option in searchOptions"
          :key="option.id"
          class="item"
          type="button"
          @click="
            () => {
              state.addDocument(option)
              modal.hide()
            }
          ">
          <div class="left">
            <img
              v-if="option.logoUrl"
              class="logo"
              :src="option.logoUrl" />
            <ScalarIcon
              v-else
              class="logo"
              logo="Openapi" />
          </div>

          <div class="right">
            <div class="item-top">
              <span>{{ option.title }}</span>

              <span class="version">v{{ option.currentVersion }}</span>
            </div>

            <span class="description">
              @{{ option.namespace }}/{{ option.slug }}
            </span>
          </div>
        </button>
      </div>
    </template>
  </ScalarModal>
</template>

<style>
.catalogModal .scalar-modal-body {
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
.searchInput {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  margin-bottom: 10px;
}
.catalog {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  overflow-y: scroll;
  font-size: var(--scalar-font-size-3);
}
.item {
  display: flex;
  padding: 15px;
  gap: 10px;
  align-items: center;
  background-color: var(--scalar-background-2);
  border-radius: var(--scalar-radius-lg);
  transition: background-color 160ms ease;
}
.item:hover {
  background-color: color-mix(
    in srgb,
    var(--scalar-background-3),
    transparent 40%
  ) !important;
}
.left {
  align-items: center;
}
.right {
  display: flex;
  flex-direction: column;
}
.logo {
  width: 25px;
}
.item-top {
  display: flex;
  gap: 10px;
}
.version {
  background: var(--scalar-background-3);
  padding: 2px 5px;
  border-radius: var(--scalar-radius);
  font-size: var(--scalar-font-size-5);
  color: var(--scalar-color-3);
}
.description {
  color: var(--scalar-color-2);
}
</style>
