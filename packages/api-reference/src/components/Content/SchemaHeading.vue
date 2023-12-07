<script lang="ts" setup>
defineProps<{
  value: Record<string, any>
  name?: string
}>()
</script>
<template>
  <span class="schema-type">
    <em :title="value.type">
      <template v-if="value.type === 'object'"> {} </template>
      <template v-if="value.type === 'array'"> [] </template>
    </em>
    <template v-if="value?.xml?.name && value?.xml?.name !== '##default'">
      &lt;{{ value?.xml?.name }} /&gt;
    </template>
    <template v-else-if="name">
      {{ name }}
    </template>
    <template v-else>
      {{ value.type }}
    </template>
  </span>
</template>
<style scoped>
.schema-type {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
</style>
