<script setup lang="ts">
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
      <template
        v-for="index in [...Array(8).keys()]"
        :key="index">
        <div class="loading" />
      </template>
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

.loading {
  background: var(--theme-background-3, var(--default-theme-background-3));
  animation: loading-skeleton 1.5s infinite alternate;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  min-height: 1.6em;
  margin: 0.6em 0;
  max-width: 50%;
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
