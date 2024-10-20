<style scoped>
.view-layout-content > :not([hidden]):not(:first-child) {
  border-top-width: calc(calc(var(--scalar-border-width) / 2));
  border-left-width: 0px;
}
.view-layout-content > :not([hidden]):first-child {
  border-bottom-width: 0px;
}

@screen xl {
  .view-layout-content > :not([hidden]):first-child {
    border-right-width: 0px;
  }
  .view-layout-content > :not([hidden]):not(:first-child) {
    border-top-width: 0px;
    border-left-width: calc(calc(var(--scalar-border-width) / 2));
  }
}
</style>
<template>
  <div
    class="*:border-t-1/2 first:*:border-t-0 xl:*:border-t-0 xl:*:border-l-1/2 xl:first:*:border-l-0 flex xl:flex-row flex-col custom-scroll pr-0">
    <slot />
  </div>
</template>
