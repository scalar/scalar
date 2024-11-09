<script setup lang="ts"></script>
<template>
  <div class="flex flex-col gap-1.5">
    <div class="px-2.5 leading text-c-1">
      <slot name="title" />
    </div>
    <div class="flex flex-col">
      <slot />
    </div>
  </div>
</template>
