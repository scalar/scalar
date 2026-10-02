<script setup lang="ts">
import ExtensionValue from './ExtensionValue.vue'

/** Display extension values using the same property rows and controls as schemas. */
const { extensions } = defineProps<{
  /** Selected extension keys and their original values, in display order. */
  extensions: Record<string, unknown>
}>()
</script>

<template>
  <dl
    v-if="Object.keys(extensions).length"
    class="my-2 min-w-0 text-base">
    <ExtensionValue
      v-for="(value, name) in extensions"
      :key="name"
      :name="name"
      :value="value" />
  </dl>
</template>
