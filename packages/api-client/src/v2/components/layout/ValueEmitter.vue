<script lang="ts">
/**
 * This component takes in any value and emits it back
 *
 * This is useful when we need to catch the open state of a disclosure from its v-slot
 */
export default {
  name: 'ValueEmitter',
}
</script>

<script setup lang="ts" generic="T">
import { watch } from 'vue'

const { value } = defineProps<{ value: T }>()
const emit = defineEmits<{ (e: 'change', value: T): void }>()

watch(
  () => value,
  (newValue) => emit('change', newValue),
  { immediate: true },
)
</script>

<!-- eslint-disable-next-line vue/valid-template-root -->
<template>
  <!-- We use this hack to emit the slot value back to the parent -->
</template>
