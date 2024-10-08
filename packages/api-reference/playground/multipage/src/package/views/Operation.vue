<script lang="ts" setup>
import Placeholder from '../../components/Placeholder.vue'

defineProps<{
  params?: {
    method: string
    path: string
  }
}>()
</script>
<template>
  <div class="p-1">
    <Placeholder style="height: 1200px">
      [Operation] {{ params ?? $router.currentRoute.value.params }}
    </Placeholder>
  </div>
</template>
