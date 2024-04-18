<script lang="ts" setup>
withDefaults(defineProps<{ lines?: number }>(), {
  lines: 1,
})
</script>

<template>
  <template
    v-for="index in [...Array(lines).keys()]"
    :key="index">
    <div
      class="loading"
      :class="{ 'single-line': lines === 1 }" />
  </template>
</template>

<style scoped>
.loading {
  background: var(--scalar-background-3);
  animation: loading-skeleton 1.5s infinite alternate;
  border-radius: var(--scalar-radius-lg);
  min-height: 1.6em;
  margin: 0.6em 0;
  max-width: 100%;
}
.loading:first-of-type {
  min-height: 3em;
  margin-bottom: 24px;
  margin-top: 0;
}
.loading:last-of-type {
  width: 60%;
}

.loading.single-line {
  min-height: 3em;
  margin: 0.6em 0;
  max-width: 80%;
}

@keyframes loading-skeleton {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.33;
  }
}
</style>
