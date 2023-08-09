<script setup lang="ts">
import type { RequestBody } from '../../../types'
import RequestBodyProperties from './RequestBodyProperties.vue'

defineProps<{ requestBody?: RequestBody }>()
</script>
<template>
  <div
    v-if="requestBody"
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

<style>
.parameter p {
  margin-top: 6px;
}
.parameter .parameter-child {
  border: var(--scalar-api-reference-theme-border);
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
  color: var(--scalar-api-reference-theme-color-3);
  font-size: var(--scalar-api-reference-theme-mini);
  display: flex;
  align-items: center;
  user-select: none;
}
.parameter-child-trigger:has(+ .parameter li:first-of-type:last-of-type) {
  display: none;
}
.parameter-child-trigger:hover {
  color: var(--scalar-api-reference-theme-color-1);
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
  padding: 12px;
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
  border-bottom: var(--scalar-api-reference-theme-border);
}

.parameter {
  list-style: none;
  font-size: var(--scalar-api-reference-theme-small);
}
.parameter li {
  border-top: var(--scalar-api-reference-theme-border);
  padding: 12px 0;
}
.parameter-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--scalar-api-reference-theme-font-code);
  font-size: 13px;
  color: var(--scalar-api-reference-theme-color-1);
}
.parameter-type,
.parameter-required {
  color: var(--scalar-api-reference-theme-color-3);
  font-weight: var(--themesemi);
  margin-right: 6px;
  position: relative;
}
.marc_required {
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--scalar-api-reference-theme-bold);
  color: #ffb040;
}
.parameter-options {
  position: relative;
}
.copy .parameter-description:empty {
  display: none;
}
</style>
