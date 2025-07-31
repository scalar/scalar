<script setup lang="ts">
import { useId } from 'vue'

const { id = useId(), hidden = false } = defineProps<{
  id?: string
  hidden?: boolean
}>()
</script>
<template>
  <div
    :id="id"
    :aria-labelledby="id ? `${id}-label` : undefined"
    class="contents"
    :role="hidden ? undefined : 'group'">
    <div
      v-if="!hidden"
      :id="`${id}-label`"
      class="min-w-0 truncate px-2.5 py-1.5 text-c-2">
      <slot name="label" />
    </div>
    <slot />
  </div>
</template>
