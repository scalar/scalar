<script setup lang="ts">
withDefaults(defineProps<{ loading?: boolean }>(), {
  loading: false,
})
</script>

<template>
  <h1
    class="section-header"
    :class="{ loading }">
    <slot v-if="!loading" />
    <template v-else></template>
  </h1>
</template>

<style scoped>
.loading {
  background: var(--theme-background-3, var(--default-theme-background-3));
  animation: loading-skeleton 1.5s infinite alternate;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  min-height: 2em;
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

.section-header {
  font-size: var(
    --font-size,
    var(
      --default-font-size,
      var(--theme-heading-2, var(--default-theme-heading-2))
    )
  );
  font-weight: var(
    --font-weight,
    var(--default-font-weight, var(--theme-bold, var(--default-theme-bold)))
  );
  /* prettier-ignore */
  color: var(--theme-color-1, var(--default-theme-color-1));
  word-wrap: break-word;
  line-height: 1.45;
  margin-top: 0;
}

.section-header.loading {
  width: 80%;
}
</style>
