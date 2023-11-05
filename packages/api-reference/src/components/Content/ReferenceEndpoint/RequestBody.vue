<script setup lang="ts">
import type { RequestBody } from '../../../types'
import RequestBodyProperties from './RequestBodyProperties.vue'

defineProps<{ requestBody?: RequestBody }>()
</script>
<template>
  <div
    v-if="requestBody && requestBody.content['application/json']"
    class="body-container">
    <div class="endpoint-title">
      <h5 class="title">Body</h5>
    </div>
    <ul
      v-if="requestBody.content['application/json']"
      class="parameter">
      <RequestBodyProperties
        :contentProperties="
          requestBody.content['application/json'].schema.properties || {}
        "
        :required="
          requestBody.content['application/json'].schema.required || []
        " />
    </ul>
  </div>
</template>

<style scoped>
.title {
  margin-bottom: 12px !important;
  margin-top: 24px !important;
}
</style>

<style>
.parameter p {
  margin-top: 6px;
}
.parameter .parameter-child {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: 20px;
  margin-top: 12px;
  width: fit-content;
}
.parameter .parameter {
  border: none !important;
}
.parameter-child-trigger {
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 500;
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-size: var(--theme-micro, var(--default-theme-micro));
  display: flex;
  align-items: center;
  user-select: none;
}
.parameter-child-trigger:has(+ .parameter li:first-of-type:last-of-type) {
  display: none;
}
.parameter-child-trigger:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.parameter-child-trigger > span:before {
  content: 'Show ';
}
.parameter-child__open > .parameter-child-trigger span:before {
  content: 'Hide ';
}
.parameter-child-trigger svg {
  height: 10px;
  width: 10px;
  margin-right: 6px;
}
.parameter-child__open .parameter-child-trigger svg {
  transform: rotate(45deg);
}
.parameter .parameter li:first-of-type {
  border-top: none;
}
.parameter .parameter li {
  padding: 10px 12px;
}
.parameter-child__open > .parameter {
  display: block;
}
.parameter .parameter-child__open {
  width: 100%;
  border-radius: 6px;
}
.parameter .parameter-child__open > svg {
  transform: rotate(45deg);
}
.parameter-child__open > .parameter-child-trigger {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.parameter {
  list-style: none;
  font-size: var(--theme-small, var(--default-theme-small));
}
.parameter li {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  padding: 12px 0;
}
.parameter-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.parameter-type,
.parameter-required {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  margin-right: 6px;
  position: relative;
}
.parameter-description {
  all: unset;
  display: block;
  margin-top: 3px;
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: 1.4;
}
.parameter-description * {
  all: unset;
  margin-top: 3px !important;
  margin-bottom: 0 !important;
}
.parameter-description p {
  color: var(--theme-color-2, var(--default-theme-color-2));
  margin-top: 3px;
}
.parameter__required {
  text-transform: uppercase;
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}
.parameter-options {
  position: relative;
}
.copy .title {
  font-size: var(--theme-heading-4, var(--default-theme-heading-4));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color-1, var(--default-theme-color-1));
  line-height: 1.45;
  margin: 0;
}
.copy .parameter-description:empty {
  display: none;
}
</style>
