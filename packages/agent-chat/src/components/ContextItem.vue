<script setup lang="ts">
const { loading } = defineProps<{ loading: boolean }>()
</script>

<template>
  <div
    class="contextItem"
    :class="{
      shimmer: loading,
    }">
    <slot />
  </div>
</template>

<style scoped>
.contextItem {
  font-size: 10px;
  display: inline-block;
  color: var(--scalar-color-2);
  cursor: pointer;
  vertical-align: middle;
  padding: 1px 8px;
  border-radius: 12px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  background: color-mix(
    in srgb,
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
}

.shimmer {
  background: var(--scalar-background-2);
  background-image: linear-gradient(
    90deg,
    #202020 0%,
    var(--scalar-background-2) 40%,
    var(--scalar-background-3) 80%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.light-mode .shimmer {
  background: var(--scalar-background-2);
  background-image: linear-gradient(
    90deg,
    #fafafa 0%,
    var(--scalar-background-2) 40%,
    var(--scalar-background-3) 80%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
