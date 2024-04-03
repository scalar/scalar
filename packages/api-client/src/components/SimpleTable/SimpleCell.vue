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
  all: unset;
  display: table-cell;
  border-right: 1px solid var(--scalar-border-color);
  position: relative;
  padding: 9px !important;
  color: var(--scalar-color-1);
  white-space: nowrap;
}
.simple-cell a {
  color: var(--scalar-color-1) !important;
}
.simple-cell:last-of-type {
  border-right: none;
}

.simple-cell.wrap {
  white-space: normal;
}

.simple-cell.strong {
  font-weight: var(--scalar-semibold);
}
</style>
