<script setup lang="ts">
import { themeClasses } from '@/constants'
</script>
<template>
  <aside
    class="w-sidebar relative flex flex-col border-r"
    :class="[themeClasses.sidebar]">
    <div class="min-h-header h-header flex items-center border-b px-4 text-sm">
      <h2 class="font-medium"><slot name="title" /></h2>
    </div>
    <div class="custom-scroll sidebar-height">
      <slot name="content" />
    </div>
    <slot name="button" />
  </aside>
</template>
<style>
.sidebar-height {
  min-height: calc(100% - 50px);
}
</style>
