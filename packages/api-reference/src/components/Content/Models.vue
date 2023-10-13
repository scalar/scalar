<script setup lang="ts">
import { type Components, type Definitions } from '../../types'

defineProps<{
  definitions?: Definitions
  components?: Components
}>()
</script>
<template>
  <div>
    <div v-if="definitions">{{ definitions }}</div>
    <div v-if="components">{{ components }}</div>
  </div>
</template>
