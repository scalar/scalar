<script lang="ts" setup>
import { computed, ref } from 'vue'

import SchemaHeading from './SchemaHeading.vue'
import SchemaProperty from './SchemaProperty.vue'

const props = withDefaults(
  defineProps<{
    value?: Record<string, any>
    level?: number
    name?: string
    compact?: boolean
    toggleVisibility?: boolean
  }>(),
  {
    level: 0,
    compact: false,
    toggleVisibility: false,
  },
)

const shouldShowToggle = computed(() => {
  if (!props.toggleVisibility) {
    return false
  }

  if (props.level === 0) {
    return false
  }

  return true
})

const visible = ref<boolean>(false)
</script>
<template>
  <div
    class="schema-card"
    :class="`${
      compact ? 'schema-card--compact' : ''
    } schema-card--level-${level}`">
    <div
      class="properties"
      :class="`properties--${
        !shouldShowToggle || visible ? 'visible' : 'hidden'
      }`">
      <template v-if="shouldShowToggle">
        <button
          class="schema-visibility-toggle"
          :class="`schema-visibility-toggle--${visible ? 'visible' : 'hidden'}`"
          type="button"
          @click="visible = !visible">
          <svg
            fill="currentColor"
            height="14"
            viewBox="0 0 14 14"
            width="14"
            xmlns="http://www.w3.org/2000/svg">
            <polygon
              fill-rule="nonzero"
              points="14 8 8 8 8 14 6 14 6 8 0 8 0 6 6 6 6 0 8 0 8 6 14 6" />
          </svg>
          <span>
            <template v-if="visible">Hide Child Attributes</template>
            <template v-else>Show Child Attributes</template>
          </span>
        </button>
      </template>
      <template v-if="!shouldShowToggle || visible">
        <template v-if="value?.properties">
          <div
            v-if="!compact"
            class="schema-card-title">
            <SchemaHeading
              :name="name"
              :value="value" />
          </div>
          <SchemaProperty
            v-for="property in Object.keys(value.properties)"
            :key="property"
            :compact="compact"
            :level="level"
            :name="property"
            :required="
              value.required &&
              value.required.length &&
              value.required.includes(property)
            "
            :toggleVisibility="toggleVisibility"
            :value="value.properties[property]" />
        </template>
        <template v-else>
          <SchemaProperty
            :compact="compact"
            :level="level"
            :name="value?.name"
            :toggleVisibility="toggleVisibility"
            :value="value" />
        </template>
      </template>
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

.schema-card--compact > .properties {
  margin: 8px 0 0;
}

.schema-card--compact.schema-card--level-0 > .properties {
  border: none;
}

.schema-visibility-toggle {
  padding: 6px 12px;
  cursor: pointer;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  display: flex;
  align-items: center;
  user-select: none;
}
.schema-visibility-toggle:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.schema-visibility-toggle svg {
  height: 10px;
  width: 10px;
  margin-right: 6px;
}
.schema-visibility-toggle--visible svg {
  transform: rotate(45deg);
}

.properties--hidden {
  border-radius: 100px;
  display: inline-block;
}
</style>
