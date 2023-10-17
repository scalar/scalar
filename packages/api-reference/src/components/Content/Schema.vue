<script lang="ts" setup>
// TODO: value.xml isn’t rendered yet
import Schema from './Schema.vue'

withDefaults(
  defineProps<{
    value?: Record<string, any>
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
      v-if="value?.properties"
      class="properties">
      <div class="type">
        <span
          class="type-icon"
          :title="value.type">
          <template v-if="value.type === 'object'"> {} </template>
          <template v-if="value.type === 'array'"> [] </template>
        </span>
        <template v-if="value?.xml?.name">
          &lt;{{ value?.xml?.name }} /&gt;
        </template>
        <template v-else>
          {{ value.type }}
        </template>
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
            v-if="value.properties[property].type"
            class="property-type">
            <template v-if="value.properties[property].type !== 'object'">
              {{ value.properties[property].type }}
            </template>
            <template v-if="value.properties[property].format">
              &middot; {{ value.properties[property].format }}
            </template>
          </div>
          <div
            v-if="value.properties[property].example"
            class="property-example">
            <code class="property-example-value">
              example: {{ value.properties[property].example }}
            </code>
          </div>
        </div>
        <div
          v-if="value.properties[property].description"
          class="property-description">
          {{ value.properties[property].description }}
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
  text-transform: uppercase;
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 10px 12px;
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
  align-items: end;
  gap: 16px;
}

.property-description {
  margin-top: 12px;
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.property:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.property-name {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}

.required,
.optional {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}

.required {
  text-transform: uppercase;
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.property-type {
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.properties {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  margin: 16px 0 0;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  overflow: hidden;
}

.property {
  padding: 12px 12px;
}

.property-example {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.property-example-value {
  padding: 12px 12px;
  background: var(--theme-background-4, var(--default-theme-background-4));
  padding: 2px 5px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(
    --default-theme-font-size-5,
    var(--default-default-theme-font-size-5)
  );
}
</style>
