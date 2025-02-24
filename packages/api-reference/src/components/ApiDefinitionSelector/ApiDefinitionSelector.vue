<script setup lang="ts">
import type { SpecConfiguration } from '@scalar/types'
import { computed } from 'vue'

const { options } = defineProps<{
  options?: SpecConfiguration[]
}>()

// Show the selector if there are multiple options
const showSelector = computed(() => options && options?.length > 1)
</script>

<template>
  <template v-if="showSelector">
    <select class="w-full">
      <option
        v-for="(option, index) in options"
        :key="index">
        #{{ index }}
      </option>
    </select>
  </template>
</template>
