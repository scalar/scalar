<script setup lang="ts">
withDefaults(
  defineProps<{
    // eslint-disable-next-line vue/no-unused-properties
    if?: boolean
  }>(),
  {
    if: true,
  },
)
</script>
<template>
  <span
    v-if="$props.if"
    class="screenreader-only">
    <slot />
  </span>
  <slot v-else />
</template>
<style scoped>
.screenreader-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
