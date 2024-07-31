<script lang="ts" setup>
defineProps<{
  src: string
  transparent?: boolean
}>()

function handleError() {
  console.log('Error')
}
</script>
<template>
  <div
    class="border-1/2 flex justify-center rounded"
    :class="{ 'p-2 bg-preview': transparent }">
    <img
      class="max-w-full rounded"
      :src="src"
      @error="handleError" />
  </div>
</template>
<style scoped>
.light-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23000' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
.dark-mode .bg-preview {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23FFF' fill-opacity='10%25'%3E%3Crect width='8' height='8' /%3E%3Crect x='8' y='8' width='8' height='8' /%3E%3C/svg%3E");
}
</style>
