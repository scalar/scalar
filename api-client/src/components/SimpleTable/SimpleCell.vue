<script lang="ts" setup>
withDefaults(
  defineProps<{ wrap?: boolean; strong?: boolean; href?: string | null }>(),
  {
    wrap: true,
    strong: false,
    href: null,
  },
)
</script>
<template>
  <td
    class="simple-cell"
    :class="{ wrap: wrap, strong: strong }">
    <template v-if="href">
      <a
        :href="href"
        rel="noopener noreferrer"
        target="_blank">
        <slot />
      </a>
    </template>
    <template v-else>
      <slot />
    </template>
  </td>
</template>
<style>
.simple-cell {
  border-right: var(--scalar-api-client-border);
  position: relative;
  padding: 0.75em;
  color: var(--scalar-api-client-theme-color-1);
  white-space: nowrap;
}

.simple-cell a {
  text-decoration: dashed underline;
  cursor: help;
}

.simple-cell.wrap {
  white-space: normal;
}

.simple-cell.strong {
  font-weight: var(--scalar-api-client-font-semibold);
}
</style>
