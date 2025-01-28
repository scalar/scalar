<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string
  controls?: string
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
    :aria-controls="controls"
    autocomplete="off"
    class="px-1.5 text-c-1 border-transparent -outline-offset-1 w-full group-last/label:rounded-br-lg"
    placeholder="value"
    spellcheck="false"
    type="text" />
</template>
