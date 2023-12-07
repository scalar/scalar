<script lang="ts" setup>
import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
  }>(),
  {
    level: 0,
  },
)
</script>
<template>
  <div class="schema-card">
    <div
      v-if="value?.properties"
      class="properties">
      <div class="schema-card-title">
        <SchemaHeading
          :name="name"
          :value="value" />
      </div>
      <SchemaProperty
        v-for="property in Object.keys(value.properties)"
        :key="property"
        :level="level"
        :name="property"
        :required="
          value.required &&
          value.required.length &&
          value.required.includes(property)
        "
        :value="value.properties[property]" />
    </div>
    <div
      v-else
      class="properties">
      <SchemaProperty
        :level="level"
        :value="value" />
    </div>
  </div>
</template>
<style scoped>
.error {
  background-color: red;
}
.schema-card {
  width: 100%;
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.schema-card-title {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 10px 12px;
}

/* Style the "icon" */
.schema-card-title :deep(em) {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.properties {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: 24px 0 0;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
}
.properties .properties {
  margin-top: 12px;
}
</style>
