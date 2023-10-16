<script setup lang="ts">
import LoadingSkeleton from '../LoadingSkeleton.vue'

withDefaults(defineProps<{ loading?: boolean; tight?: boolean }>(), {
  loading: false,
  tight: false,
})
</script>

<template>
  <LoadingSkeleton v-if="loading" />
  <h1
    v-else
    class="section-header"
    :class="{ tight }">
    <slot />
  </h1>
</template>

<style scoped>
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
  margin-bottom: 24px;
}

.section-header.tight {
  margin-bottom: 6px;
}

.section-header.loading {
  width: 80%;
}
</style>
