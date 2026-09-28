<script setup lang="ts">
withDefaults(
  defineProps<{
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
<!--
  `.screenreader-only` is declared globally in styles/tailwind.config.css rather
  than scoped here, so other components can hide text without wrapping it in
  this component.
-->
