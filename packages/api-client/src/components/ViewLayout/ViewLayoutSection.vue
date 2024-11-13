<template>
  <section
    class="flex h-full xl:min-w-0 xl:flex-1 flex-col xl:custom-scroll bg-b-1">
    <div
      class="min-h-12 xl:min-h-header flex items-center border-b-1/2 px-3.5 py-1.5 md:px-4 md:py-2 xl:px-6 xl:pr-5 text-sm font-medium sticky top-0 bg-b-1 xl:rounded-none z-1">
      <slot name="title" />
    </div>
    <slot />
  </section>
</template>
