<script setup lang="ts">
import { ScalarPopover, ScalarTextInput } from '@scalar/components'
import { ScalarIconMagnifyingGlass } from '@scalar/icons'
import { computed } from 'vue'

import { useSearch } from '@/hooks/use-search'
import { useState } from '@/state/state'

const state = useState()

const search = useSearch()

const searchOptions = computed(() =>
  search.results.value
    .filter(
      (r) =>
        !state.registryDocuments.value.some(
          (d) => d.namespace === r.namespace && d.slug === r.slug,
        ),
    )
    .map((result) => ({
      ...result,
      label: result.title,
      id: result.id,
    })),
)
</script>

<template>
  <ScalarPopover
    :offset="0"
    placement="top-start"
    resize
    style="width: 220px">
    <slot />
    <template #popover="{ close }">
      <ScalarTextInput
        autofocus
        class="searchInput"
        :modelValue="search.query.value"
        placeholder="Add an API"
        @update:modelValue="(v) => (search.query.value = v ?? '')">
        <template #prefix>
          <ScalarIconMagnifyingGlass class="searchIcon" />
        </template>
      </ScalarTextInput>

      <template v-if="searchOptions.length">
        <button
          v-for="option in searchOptions"
          :key="option.id"
          class="searchItem"
          type="button"
          @click="
            () => {
              state.addDocument(option)
              close()
            }
          ">
          <img
            v-if="option.logoUrl"
            class="searchItemLogo"
            :src="option.logoUrl" />
          <span>{{ option.title }}</span>
        </button>
      </template>

      <span
        v-else
        class="searchResultsEmpty">
        No APIs found
      </span>
    </template>
  </ScalarPopover>
</template>

<style scoped>
.searchItem {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  font-size: var(--scalar-font-size-3);
}

.searchInput {
  margin-bottom: 5px;
}

.searchItem:hover {
  background: var(--scalar-background-2);
}

.searchItemLogo {
  width: 15px;
}

.searchIcon {
  margin-right: 7px;
}

.searchResultsEmpty {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);
  margin: 10px;
}
</style>
