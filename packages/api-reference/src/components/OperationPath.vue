<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  path: string
  deprecated?: boolean
}>()

const isVariable = (part: string) => part.startsWith('{') && part.endsWith('}')

// Split where there are variables
const pathParts = computed<string[]>(() => props.path.split(/({[^}]+})/))
</script>
<template>
  <span
    class="operation-path"
    :class="{ deprecated: deprecated }">
    <template
      v-for="(part, i) in pathParts"
      :key="i">
      <span
        v-if="isVariable(part)"
        class="variable"
        v-text="part" />
      <template v-else>{{ part }}</template>
    </template>
  </span>
</template>

<style scoped>
.operation-path {
  overflow: hidden;
  font-family: var(--scalar-font-code);
  font-weight: var(--scalar-semibold);
  word-wrap: break-word;
  line-break: anywhere;
}

.variable {
  color: var(--scalar-color-1);
}

.deprecated {
  text-decoration: line-through;
}
</style>
