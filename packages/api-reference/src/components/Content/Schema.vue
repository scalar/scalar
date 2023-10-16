<script lang="ts" setup>
// TODO: value.xml isn’t rendered yet
import Schema from './Schema.vue'

withDefaults(
  defineProps<{
    value: Record<string, any>
    level?: number
  }>(),
  {
    level: 0,
  },
)
</script>
<template>
  <div class="schema">
    <div
      v-if="value.properties"
      class="properties">
      <div class="type">
        <span class="type-icon">
          <template v-if="value.type === 'object'"> {} </template>
          <template v-if="value.type === 'array'"> [] </template>
        </span>
        {{ value.type }}
      </div>
      <div
        v-for="property in Object.keys(value.properties)"
        :key="property"
        class="property">
        <div class="property-information">
          <div class="property-name">
            {{ property }}
          </div>
          <div
            v-if="value?.required?.includes(property)"
            class="required">
            required
          </div>
          <div
            v-else
            class="optional">
            optional
          </div>
          <div
            v-if="value.properties[property].type"
            class="property-type">
            {{ value.properties[property].type }}
            <template v-if="value.properties[property].format">
              / {{ value.properties[property].format }}
            </template>
          </div>
          <div
            v-if="value.properties[property].example"
            class="example-value">
            <code>Example: {{ value.properties[property].example }}</code>
          </div>
        </div>
        <div
          v-if="value.properties[property].properties"
          class="children">
          <Schema
            v-if="level < 3"
            :level="level + 1"
            :value="value.properties[property]" />
        </div>
        <!-- TODO: .items for array -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema {
  max-width: 600px;
  width: 100%;
  font-size: var(--default-theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.type {
  font-size: var(--default-theme-font-size-4, var(--default-theme-font-size-4));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-weight: var(--theme-bold, var(--default-theme-bold));
  padding: 6px 0 12px;
  text-transform: uppercase;
}

.type-icon {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--default-theme-font-size-3, var(--default-theme-font-size-3));
}

.property {
  padding: 12px 0;
}

.property-information {
  display: flex;
  align-items: center;
  gap: 12px;
}

.property:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.property-name {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.required {
  text-transform: uppercase;
}

.required,
.optional {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}

.properties {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: 16px 0 0;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.type {
  padding: 12px;
  background: var(--theme-background-4, var(--default-theme-background-4));
}
.property {
  padding: 12px 12px;
}

code {
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 2px 3px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}
</style>
