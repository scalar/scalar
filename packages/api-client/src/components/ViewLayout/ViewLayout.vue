<style scoped>
.view-layout > :not([hidden]):not(:first-child) {
  border-top-width: calc(calc(var(--scalar-border-width) / 2));
  border-left-width: 0px;
}
.view-layout > :not([hidden]):first-child {
  border-bottom-width: 0px;
}

@screen xl {
  .view-layout > :not([hidden]):first-child {
    border-right-width: 0px;
  }
  .view-layout > :not([hidden]):not(:first-child) {
    border-top-width: 0px;
    border-left-width: calc(calc(var(--scalar-border-width) / 2));
  }
}
</style>
<template>
  <div
    class="flex flex-col min-h-0 flex-1 xl:overflow-hidden md:flex-row leading-3">
    <slot />
  </div>
</template>
