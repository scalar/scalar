<template>
  <!-- Using *:border-* to avoid chrome performance issue with adjacent sibling selector (~) -->
  <div
    class="*:border-t-1/2 first:*:border-t-0 xl:*:border-t-0 xl:*:border-l-1/2 xl:first:*:border-l-0 flex xl:flex-row flex-col custom-scroll pr-0">
    <slot />
  </div>
</template>
