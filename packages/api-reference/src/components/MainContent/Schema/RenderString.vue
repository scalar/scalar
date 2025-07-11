<script setup lang="ts">
/**
 * Give this component any data, and it tries to render a meaningful string.
 *
 * @example
 * <RenderString :value="1" /> => "1"
 * <RenderString :value="true" /> => "true"
 * <RenderString :value="false" /> => "false"
 * <RenderString :value="null" /> => "null"
 * <RenderString :value="undefined" /> => "undefined"
 * <RenderString :value="{}" /> => "{}"
 * <RenderString :value="[]" /> => "[]"
 * <RenderString :value="['a', 'b', 'c']" /> => "['a', 'b', 'c']"
 * <RenderString :value="() => 'hello'" /> => "() => 'hello'"
 * <RenderString :value="Symbol('test')" /> => "Symbol(test)"
 **/
import { computed } from 'vue'

const { value } = defineProps<{
  value: any
}>()

const valueAsString = computed(() => {
  if (value === '') {
    return `''`
  }

  if (value === null) {
    return 'null'
  }

  if (value === undefined) {
    return 'undefined'
  }

  // We don't need to cover all cases, Vue does a good job of rendering objects, arrays and functions.
  return value
})
</script>

<template>
  {{ valueAsString }}
</template>
