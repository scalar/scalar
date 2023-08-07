<script setup lang="ts">
import type { Parameters } from '../../../types'
import ParameterItem from './ParameterItem.vue'

defineProps<{ parameters?: Parameters[]; title: string }>()
</script>
<template>
  <div
    v-if="parameters?.length"
    class="parameters-container">
    <div class="endpoint-title">
      <h5 class="title">
        {{ title }}
      </h5>
    </div>
    <ul class="parameter">
      <ParameterItem
        v-for="item in parameters"
        :key="item.name"
        :parameter="item" />
    </ul>
  </div>
</template>
