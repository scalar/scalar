<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string
  controls: string | undefined
}>()

const emit = defineEmits<{
  (e: 'change', v: string): void
}>()

const model = computed<string>({
  get: () => props.value,
  set: (v) => emit('change', v),
})
</script>
<template>
  <input
    v-model="model"
    v-bind="controls ? { ...$attrs, 'aria-controls': controls } : {}"
    autocomplete="off"
    class="text-c-1 w-full border-transparent px-1.5 -outline-offset-1 group-last/label:rounded-br-lg"
    placeholder="value"
    spellcheck="false"
    type="text" />
</template>
