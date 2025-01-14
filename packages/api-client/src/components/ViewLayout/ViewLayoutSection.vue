<template>
  <section
    class="flex xl:h-full xl:min-w-0 flex-1 flex-col xl:custom-scroll bg-b-1">
    <div
      class="min-h-11 flex items-center px-2.5 text-sm font-medium sticky top-0 bg-b-1 xl:rounded-none z-1">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
