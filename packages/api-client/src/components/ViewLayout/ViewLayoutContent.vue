<template>
  <!-- Using *:border-* to avoid chrome performance issue with adjacent sibling selector (~) -->
  <div
    class="custom-scroll flex flex-col pr-0 *:border-t *:first:border-t-0 xl:flex-row *:xl:border-t-0 *:xl:border-l *:first:xl:border-l-0">
    <slot />
  </div>
</template>
