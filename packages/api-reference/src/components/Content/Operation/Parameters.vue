<script setup lang="ts">
import type { Parameters } from '@scalar/oas-utils'

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
  font-size: var(--scalar-heading-4);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  line-height: 1.45;
  margin-top: 12px;
  margin-bottom: 12px;
}

.parameter-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--scalar-small);
  margin-bottom: 12px;
}
</style>
