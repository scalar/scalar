<script setup lang="ts">
import LoadingSkeleton from '../LoadingSkeleton.vue'

defineProps<{
  loading?: boolean
  tight?: boolean
}>()
</script>

<template>
  <div class="section-header-wrapper xl:gap-12">
    <LoadingSkeleton v-if="loading" />
    <div
      v-else
      class="section-header"
      :class="{ tight }">
      <slot />
    </div>
    <slot
      v-if="$slots.links"
      name="links" />
  </div>
</template>

<style scoped>
@reference "@/style.css";

.section-header-wrapper {
  display: grid;
  grid-template-columns: 1fr;
}

@variant xl {
  .section-header-wrapper {
    grid-template-columns: repeat(2, 1fr);
  }
}

.section-header {
  font-size: var(--font-size, var(--scalar-heading-1));
  font-weight: var(--font-weight, var(--scalar-bold));
  /* prettier-ignore */
  color: var(--scalar-color-1);
  word-wrap: break-word;
  line-height: 1.45;
  margin-top: 0;
  margin-bottom: 12px;
}

.section-header.tight {
  margin-bottom: 6px;
}

.section-header.loading {
  width: 80%;
}
</style>
