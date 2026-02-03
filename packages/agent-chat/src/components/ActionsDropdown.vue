<script setup lang="ts">
import {
  ScalarDropdown,
  ScalarDropdownItem,
  useModal,
} from '@scalar/components'
import { ScalarIconMagnifyingGlass, ScalarIconUpload } from '@scalar/icons'

import Catalog from '@/views/Catalog/Catalog.vue'

defineEmits<{
  (e: 'uploadApi'): void
}>()

const catalogModal = useModal()
</script>

<template>
  <ScalarDropdown :offset="{ crossAxis: -5, mainAxis: 5 }">
    <slot />

    <template #items>
      <ScalarDropdownItem @click="$emit('uploadApi')">
        <div class="dropdown-item">
          <ScalarIconUpload />
          Upload API
        </div>
      </ScalarDropdownItem>

      <ScalarDropdownItem @click="catalogModal.show()">
        <div class="dropdown-item">
          <ScalarIconMagnifyingGlass />
          Search Catalog
        </div>
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
