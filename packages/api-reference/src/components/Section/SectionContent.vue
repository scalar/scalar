<script setup lang="ts">
import LoadingSkeleton from '../LoadingSkeleton.vue'

withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)
</script>

<template>
  <div class="section-content">
    <slot v-if="!loading" />
    <template v-else>
      <LoadingSkeleton :lines="8" />
    </template>
  </div>
</template>

<style scoped>
.section-content {
}

.references-narrow .section-content--with-columns {
  flex-direction: column;
  gap: 24px;
}
</style>
