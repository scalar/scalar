<script setup lang="ts">
import type { Parameters } from '../../../types'
import ParameterItem from './ParameterItem.vue'

withDefaults(
  defineProps<{ parameters?: Parameters[]; showChildren?: boolean }>(),
  {
    showChildren: false,
  },
)
</script>
<template>
  <div
    v-if="parameters?.length"
    class="parameters">
    <div class="parameters-title">
      <slot name="title" />
    </div>
    <ul class="parameter-list">
      <ParameterItem
        v-for="item in parameters"
        :key="item.name"
        :parameter="item"
        :showChildren="showChildren" />
    </ul>
  </div>
</template>

<style scoped>
.parameters {
  margin-top: 24px;
}
.parameters-title {
  font-size: var(--theme-heading-4, var(--default-theme-heading-4));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.45;
  margin-top: 12px;
  margin-bottom: 12px;
}

.parameter-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--theme-small, var(--default-theme-small));
  margin-bottom: 12px;
}
</style>
