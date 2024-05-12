<script setup lang="ts">
import type { BaseParameter } from '@scalar/oas-utils'
import { computed } from 'vue'

import GridRow from './GridRow.vue'

const props = defineProps<BaseParameter>()

const emit = defineEmits<{
  (e: 'update:name', v: string): void
  (e: 'update:value', v: string): void
  (e: 'update:description', v: string): void
  (e: 'update:enabled', v: boolean): void
  (e: 'delete'): void
}>()

const nameProxy = computed<string>({
  get: () => props.name,
  set: (v) => {
    // Make sure to enable the field if they edit the name
    emit('update:enabled', true)
    emit('update:name', v)
  },
})

const valueProxy = computed<string>({
  get: () => `${props.value}`,
  set: (v) => {
    // Make sure to enable the field if they edit the value
    emit('update:enabled', true)
    emit('update:value', v)
  },
})

const descriptionProxy = computed<string>({
  get: () => props.description ?? '',
  set: (v) => emit('update:description', v),
})

const enabledProxy = computed<boolean>({
  get: () => props.enabled,
  set: (checked) => emit('update:enabled', checked),
})
</script>
<template>
  <GridRow
    class="table-row-editable"
    :class="{ 'required-parameter': required }">
    <template #key>
      <input
        v-model="nameProxy"
        placeholder="Key" />
    </template>
    <template #value>
      <input
        v-model="valueProxy"
        placeholder="Value" />
    </template>
    <template #description>
      <input
        v-model="descriptionProxy"
        placeholder="Description" />
    </template>
    <template #meta>
      <label class="meta-check">
        <input
          v-model="enabledProxy"
          type="checkbox" />
        <span class="meta-checkmark" />
      </label>
      <button
        v-if="!required"
        class="meta-delete"
        type="button"
        @click="$emit('delete')">
        <svg
          fill="none"
          height="10"
          viewBox="-0.5 -0.5 10 10"
          width="10"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="m8.55 0.45 -8.1 8.1"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"></path>
          <path
            d="m0.45 0.45 8.1 8.1"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"></path>
        </svg>
      </button>
    </template>
  </GridRow>
</template>
<style scoped>
.table-row-editable.required-parameter
  :deep(.table-row-item:nth-of-type(2):after) {
  content: 'Required';
  position: absolute;
  top: 4px;
  right: 0;
  padding: 5px 9px 5px 6px;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-1);
  box-shadow: -2px 0 4px var(--scalar-background-1);
}
.table-row-editable.required-parameter
  :deep(.table-row-item:nth-of-type(2):focus-within:after) {
  display: none;
}
.table-row-meta-check {
  width: 18px;
  height: 18px;
  border-radius: var(--scalar-radius-lg);
  background: rgba(47, 177, 228, 0.1);
}
.meta-check {
  display: flex;
  position: relative;
  cursor: pointer;
  align-items: center;
  font-size: var(--scalar-micro);
  border-radius: var(--scalar-radius-lg);
  user-select: none;
  margin: 0 1px;
  transition: all 0.15s ease-in-out;
}
.meta-check input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.meta-checkmark {
  height: 17px;
  width: 17px;
  background: var(--scalar-background-3);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.meta-checkmark:hover {
  background: var(--scalar-background-3);
}
.meta-check:focus-within .meta-checkmark {
  box-shadow: 0 0 0 1px var(--scalar-color-1);
}
.meta-check .meta-checkmark:after {
  content: '';
  display: none;
  width: 5px;
  height: 8px;
  border: solid var(--scalar-color-1);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate3d(0, -1px, 0);
}
.meta-check input:checked ~ .meta-checkmark:after {
  display: block;
}
.meta-checkmark:hover {
  background: color-mix(
    in srgb,
    var(--scalar-background-3) 90%,
    var(--scalar-color-1)
  );
}
.meta-delete {
  position: absolute;
  right: -9px;
  background: var(--scalar-background-1);
  height: 20px;
  width: 20px;
  border: none;
  outline: none;
  border-radius: 50%;
  opacity: 0;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--scalar-shadow-1);
  z-index: 10;
}
.meta-delete svg {
  width: 11px;
  height: 11px;
  color: var(--scalar-color-3);
}
.meta-delete:hover svg {
  color: var(--scalar-color-red);
}
.meta-delete:focus svg {
  color: var(--scalar-color-1);
}
.meta-delete:focus {
  border-color: var(--scalar-color-1);
  color: var(--scalar-color-1);
}
.table-row-editable:hover .meta-delete {
  opacity: 1;
}
@media (pointer: coarse) {
  .table-row-editable:hover .meta-delete {
    opacity: 1;
  }
}
</style>
