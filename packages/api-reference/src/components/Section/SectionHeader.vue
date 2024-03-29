<script setup lang="ts">
import LoadingSkeleton from '../LoadingSkeleton.vue'

withDefaults(
  defineProps<{ loading?: boolean; tight?: boolean; level?: number }>(),
  {
    loading: false,
    tight: false,
    level: 1,
  },
)
</script>

<template>
  <LoadingSkeleton v-if="loading" />
  <component
    :is="`h${level}`"
    v-else
    class="section-header"
    :class="{ tight }">
    <slot />
  </component>
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
  margin-top: 0;
  margin-bottom: 12px;
}
.section-header--3 {
  font-size: var(
    --font-size,
    var(
      --default-font-size,
      var(--theme-heading-3, var(--default-theme-heading-3))
    )
  );
  margin-bottom: 0;
}
.section-header.tight {
  margin-bottom: 6px;
}

.section-header.loading {
  width: 80%;
}
</style>
