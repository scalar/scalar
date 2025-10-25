<script setup lang="ts">
defineProps<{
  placeholder: string
}>()

const model = defineModel<string>({ required: true })
</script>
<template>
  <div class="group pointer-events-none flex flex-1 items-center gap-1">
    <label
      class="pointer-events-auto absolute top-0 left-0 h-full w-full cursor-text opacity-0">
      asdasd
      <input
        v-model="model"
        class="text-c-1 group-hover-input pointer-events-auto relative z-10 -ml-0.5 h-8 w-full flex-1 rounded pl-1.25 has-[:focus-visible]:outline md:-ml-1.25"
        :placeholder="placeholder" />
    </label>
  </div>
</template>
<style scoped>
.group-hover-input {
  border-width: var(--scalar-border-width);
  border-color: transparent;
}
.group:hover .group-hover-input {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  border-color: var(--scalar-border-color);
}
.group-hover-input:focus {
  background: transparent !important;
  border-color: var(--scalar-border-color) !important;
}
</style>
