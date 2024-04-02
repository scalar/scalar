<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { BaseParameter } from '@scalar/oas-utils'
import { ref } from 'vue'

import { clickGeneratedParameter } from '../../clientBus'
import type { GeneratedParameter } from '../../types'

defineProps<{
  items?: BaseParameter[]
  generatedItems?: GeneratedParameter[]
  addLabel?: string
  showMoreFilter?: boolean
}>()

const emits = defineEmits<{
  (event: 'deleteIndex', value: number): void
  (event: 'addAnother'): void
}>()

const showDescription = ref(false)
const showMore = ref(false)

function addHandler() {
  emits('addAnother')
  showMore.value = true
}
</script>
<template>
  <div class="table">
    <div class="table-row">
      <div class="table-row-item">
        <label>Key</label>
      </div>
      <div class="table-row-item">
        <label>Value</label>
      </div>
      <div
        v-show="showDescription"
        class="table-row-item">
        <label>Description</label>
      </div>
      <div
        class="table-row-meta"
        @click="showDescription = !showDescription">
        <svg
          fill="currentColor"
          height="12"
          viewBox="0 0 18 12"
          width="18"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 12h12v-2H0v2zM0 0v2h18V0H0zm0 7h18V5H0v2z"
            fill-rule="nonzero" />
        </svg>
      </div>
    </div>
    <template
      v-for="item in generatedItems"
      :key="item.id">
      <div
        class="table-row generated-parameter"
        @click="clickGeneratedParameter.emit()">
        <div class="table-row-item">
          <input
            v-model="item.name"
            disabled
            placeholder="key" />
        </div>
        <div class="table-row-item">
          <input
            v-model="item.value"
            disabled
            placeholder="value"
            type="password" />
        </div>
        <div
          v-show="showDescription"
          class="table-row-item">
          <input
            disabled
            value="Read-only" />
        </div>
        <div class="table-row-meta">
          <!-- generated -->
        </div>
      </div>
    </template>
    <template
      v-for="(item, index) in items"
      :key="item.id">
      <div
        v-show="!showMoreFilter || (showMoreFilter && index < 5) || showMore"
        class="table-row"
        :class="{
          'required-parameter': item.required,
        }">
        <div class="table-row-item">
          <input
            v-model="item.name"
            placeholder="Key" />
        </div>
        <div class="table-row-item">
          <input
            v-model="item.value"
            placeholder="Value" />
        </div>
        <div
          v-show="showDescription"
          class="table-row-item">
          <input
            v-model="item.description"
            placeholder="Description" />
        </div>
        <div class="table-row-meta">
          <label class="meta-check">
            <input
              v-model="item.enabled"
              checked
              type="checkbox" />
            <span class="meta-checkmark" />
          </label>
          <button
            class="meta-delete"
            type="button"
            @click="$emit('deleteIndex', index)">
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
        </div>
      </div>
    </template>
    <div class="meta-actions">
      <button
        v-if="addLabel"
        class="meta-actions-item"
        type="button"
        @click="addHandler">
        <i class="meta-actions-item-icon">
          <ScalarIcon icon="Add" />
        </i>
        {{ addLabel }}
      </button>
      <button
        v-if="showMoreFilter && items && items.length > 5 && !showMore"
        class="meta-actions-item"
        type="button"
        @click="showMore = true">
        Show More
        <i class="meta-actions-item-icon">
          <ScalarIcon icon="ChevronDown" />
        </i>
      </button>
    </div>
  </div>
</template>
<style scoped>
.table {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  background: transparent;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  width: 100%;
}
.table-row {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  position: relative;
}
.table-row__add {
  border-radius: 0 0 var(--theme-radius-lg, var(--default-theme-radius-lg))
    var(--theme-radius-lg, var(--default-theme-radius-lg));
  border-bottom: none;
}
.table-row.required-parameter .table-row-item:nth-of-type(2):after {
  content: 'Required';
  position: absolute;
  top: 4px;
  right: 0;
  padding: 5px 9px 5px 6px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: var(--theme-background-2, var(--default-theme-background-2));
  box-shadow: -2px 0 4px
    var(--theme-background-2, var(--default-theme-background-2));
}
.table-row.required-parameter
  .table-row-item:nth-of-type(2):focus-within:after {
  display: none;
}

.table-row.generated-parameter * {
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.table-row.generated-parameter input {
  pointer-events: none;
}
.table-row:last-of-type {
  border-bottom: none;
}
.table-row__active {
  border-radius: 0 0 var(--theme-radius-lg, var(--default-theme-radius-lg))
    var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.table-row-drag {
  width: 20px;
  flex-shrink: 0;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  align-items: center;
  justify-content: center;
  display: none;
}
.table-row-drag svg {
  width: 6px;
  fill: var(--theme-color-3, var(--default-theme-color-3));
}
.table-row-drag .table-row-drag-add {
  width: 8px;
}
.table-row-item {
  width: 100%;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  position: relative;
}
.table-row-item-menu {
  position: absolute;
  right: 6px;
  background: var(--theme-background-2, var(--default-theme-background-2));
  width: 24px;
  height: 24px;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  cursor: pointer;
}
.table-row-item input:focus + .table-row-item-menu,
.table-row-item:hover .table-row-item-menu {
  opacity: 1;
}
.table-row-item-menu svg {
  height: 12px;
  width: initial;
  fill: var(--theme-color-3, var(--default-theme-color-3));
}
.table-row-item-menu:hover svg {
  fill: var(--theme-color-1, var(--default-theme-color-1));
}
.table-row-item input {
  border: none;
  appearance: none;
  outline: none;
  padding: 9px;
  width: 100%;
  min-height: 100%;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-micro, var(--default-theme-micro));
  background: transparent;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.table-row-item input::placeholder {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.table-row-item input[disabled] {
  background: transparent;
}
.table-row-item input:focus {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1));
}
.table-row-item label {
  background: transparent;
  text-transform: uppercase;
  display: block;
  padding: 9px;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-micro, var(--default-theme-micro));
}
.table-row-meta {
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 51px;
  user-select: none;
}
.table-row-meta-check {
  width: 18px;
  height: 18px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  background: rgba(47, 177, 228, 0.1);
}
.table-row-meta svg {
  width: 13px;
  height: 13px;
  margin: 0 1px;
  color: var(--theme-color-3, var(--default-theme-color-3));
  cursor: pointer;
}
.table-row-meta svg:hover {
  color: var(--theme-color-2, var(--default-theme-color-2));
}
.meta-check {
  display: flex;
  position: relative;
  cursor: pointer;
  align-items: center;
  font-size: var(--theme-micro, var(--default-theme-micro));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
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
  background: var(--theme-background-3, var(--default-theme-background-3));
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.meta-checkmark:hover {
  background: var(--theme-background-3, var(--default-theme-background-3));
}
.meta-check:focus-within .meta-checkmark {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1));
}
.meta-check .meta-checkmark:after {
  content: '';
  display: none;
  width: 5px;
  height: 8px;
  border: solid var(--theme-color-1, var(--default-theme-color-1));
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg) translate3d(0, -1px, 0);
}
.meta-check input:checked ~ .meta-checkmark:after {
  display: block;
}
.meta-check input:checked ~ .meta-checkmark:hover {
  background: transparent;
}
.meta-delete {
  position: absolute;
  right: -9px;
  background: var(
    --theme-background-3,
    var(--default-theme-background-3)
  ) !important;
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
}
.meta-delete svg {
  width: 11px;
  height: 11px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.meta-delete:hover svg {
  color: var(--theme-color-red, var(--default-theme-color-red));
}
.meta-delete:focus svg {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.meta-delete:focus {
  border-color: var(--theme-color-1, var(--default-theme-color-1));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.table-row:hover .meta-delete {
  opacity: 1;
}
@media (pointer: coarse) {
  .table-row:hover .meta-delete {
    opacity: 1;
  }
}
.meta-actions-item {
  border: none;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  appearance: none;
  padding: 9px;
  width: 100%;
  appearance: none;
  outline: none;
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-family: var(--theme-font, var(--default-theme-font));
  color: var(--theme-color-3, var(--default-theme-color-3));
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.meta-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.meta-actions-item:nth-of-type(2) {
  display: flex;
  justify-content: flex-end;
}
.meta-actions-item:nth-of-type(2) i {
  filter: drop-shadow(0 0.125px 0 currentColor)
    drop-shadow(0 -0.125px 0 currentColor);
}
.meta-actions-item-icon {
  width: 12px;
  height: 12px;
}
.meta-actions-item:hover,
.meta-actions-item:focus {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
