<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { BaseParameter } from '@scalar/oas-utils'
import { ref } from 'vue'

import { clickGeneratedParameter } from '../../clientBus'
import type { GeneratedParameter } from '../../types'
import GridHeader from './GridHeader.vue'
import GridRowEditable from './GridRowEditable.vue'
import GridRowGenerated from './GridRowGenerated.vue'

defineProps<{
  items?: BaseParameter[]
  generatedItems?: GeneratedParameter[]
  addLabel?: string
  showMoreFilter?: boolean
}>()

const emits = defineEmits<{
  (event: 'deleteIndex', value: number): void
  (event: 'addAnother'): void
}>()

const showDescription = ref(false)
const showMore = ref(false)

function addHandler() {
  emits('addAnother')
  showMore.value = true
}
</script>
<template>
  <div class="table">
    <GridHeader v-model:showDescription="showDescription" />
    <GridRowGenerated
      v-for="item in generatedItems"
      :key="item.name"
      :item="item"
      :showDescription="showDescription"
      @click="clickGeneratedParameter.emit()" />
    <GridRowEditable
      v-for="(item, index) in items"
      v-show="!showMoreFilter || (showMoreFilter && index < 5) || showMore"
      :key="index"
      v-model:description="item.description"
      v-model:enabled="item.enabled"
      v-model:name="item.name"
      v-model:value="item.value"
      :required="item.required"
      :showDescription="showDescription"
      @delete="$emit('deleteIndex', index)" />
    <div class="meta-actions">
      <button
        v-if="addLabel"
        class="meta-actions-item"
        type="button"
        @click="addHandler">
        <i class="meta-actions-item-icon">
          <ScalarIcon icon="Add" />
        </i>
        {{ addLabel }}
      </button>
      <button
        v-if="showMoreFilter && items && items.length > 5 && !showMore"
        class="meta-actions-item"
        type="button"
        @click="showMore = true">
        Show More
        <i class="meta-actions-item-icon">
          <ScalarIcon icon="ChevronDown" />
        </i>
      </button>
    </div>
  </div>
</template>
<style scoped>
.table {
  border: 1px solid var(--scalar-border-color);
  background: transparent;
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  width: 100%;
}
.meta-actions-item {
  border: none;
  font-weight: var(--scalar-semibold);
  appearance: none;
  padding: 9px;
  width: 100%;
  appearance: none;
  outline: none;
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font);
  color: var(--scalar-color-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.meta-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.meta-actions-item:nth-of-type(2) {
  display: flex;
  justify-content: flex-end;
}
.meta-actions-item:nth-of-type(2) i {
  filter: drop-shadow(0 0.125px 0 currentColor)
    drop-shadow(0 -0.125px 0 currentColor);
}
.meta-actions-item-icon {
  width: 12px;
  height: 12px;
}
.meta-actions-item:hover,
.meta-actions-item:focus {
  color: var(--scalar-color-1);
}
</style>
