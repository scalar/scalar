<script setup lang="ts">
import {
  ScalarDropdown,
  ScalarDropdownItem,
  useModal,
} from '@scalar/components'
import { ScalarIconMagnifyingGlass, ScalarIconUpload } from '@scalar/icons'

import { useState } from '@/state/state'
import Catalog from '@/views/Catalog/Catalog.vue'

defineEmits<{
  (e: 'uploadApi'): void
}>()

const state = useState()
const catalogModal = useModal()
</script>

<template>
  <ScalarDropdown :offset="{ crossAxis: -5, mainAxis: 5 }">
    <slot />

    <template #items>
      <ScalarDropdownItem
        v-if="state.isLoggedIn?.value"
        class="dropdown-item"
        @click="$emit('uploadApi')">
        <ScalarIconUpload />
        Upload API
      </ScalarDropdownItem>

      <ScalarDropdownItem
        class="dropdown-item"
        @click="catalogModal.show()">
        <ScalarIconMagnifyingGlass />
        Search Catalog
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>

  <Catalog
    v-if="catalogModal.open"
    :modal="catalogModal" />
</template>

<style scoped>
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
