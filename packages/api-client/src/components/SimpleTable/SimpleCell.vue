<script lang="ts" setup>
import HelpfulLink from '../HelpfulLink.vue'

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
      <HelpfulLink :href="href">
        <slot />
      </HelpfulLink>
    </template>
    <template v-else>
      <slot />
    </template>
  </td>
</template>
<style scoped>
.simple-cell {
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  position: relative;
  padding: 0.75em;
  color: var(--theme-color-1, var(--default-theme-color-1));
  white-space: nowrap;
}

.simple-cell:last-of-type {
  border-right: none;
}

.simple-cell.wrap {
  white-space: normal;
}

.simple-cell.strong {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
</style>
