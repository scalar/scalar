<template>
  <!-- Using *:border-* to avoid chrome performance issue with adjacent sibling selector (~) -->
  <div
    class="*:border-t-1/2 xl:*:border-l-1/2 custom-scroll flex flex-col pr-0 first:*:border-t-0 xl:flex-row xl:*:border-t-0 xl:first:*:border-l-0">
    <slot />
  </div>
</template>
