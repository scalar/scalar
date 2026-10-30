<script setup lang="ts">
import ExtensionValue from './ExtensionValue.vue'

/** Display extension values using the same property rows and controls as schemas. */
const { extensions, compact = false } = defineProps<{
  /** Selected extension keys and their original values, in display order. */
  extensions: Record<string, unknown>
  /** Let the containing panel provide spacing around primitive values. */
  compact?: boolean
}>()
</script>

<template>
  <dl
    v-if="Object.keys(extensions).length"
    class="min-w-0 text-base"
    :class="{ 'my-2': !compact }">
    <ExtensionValue
      v-for="(value, name) in extensions"
      :key="name"
      :compact="compact"
      :name="name"
      :value="value" />
  </dl>
</template>
