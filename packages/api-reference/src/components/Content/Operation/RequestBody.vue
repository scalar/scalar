<script setup lang="ts">
import type { ContentType, RequestBody } from '@scalar/oas-utils'
import { computed, ref } from 'vue'

import { MarkdownRenderer } from '../../MarkdownRenderer'
import { Schema } from '../Schema'

const prop = defineProps<{ requestBody?: RequestBody }>()

const contentTypes = computed(() => {
  if (prop.requestBody?.content) {
    return Object.keys(prop.requestBody.content)
  }
  return []
})

const selectedContentType = ref<ContentType>('application/json')
if (prop.requestBody?.content) {
  if (contentTypes.value.length > 0) {
    selectedContentType.value = contentTypes.value[0] as ContentType
  }
}
</script>
<template>
  <div v-if="prop?.requestBody">
    <div class="request-body-title">
      <slot name="title" />
      <div
        class="request-body-title-select"
        :class="{ 'request-body-title-no-select': contentTypes.length <= 1 }">
        <span>{{ selectedContentType }}</span>
        <select
          v-if="prop?.requestBody && contentTypes.length > 1"
          v-model="selectedContentType">
          <option
            v-for="(value, key) in prop.requestBody?.content"
            :key="key"
            :value="key">
            {{ key }}
          </option>
        </select>
      </div>
      <div
        v-if="prop?.requestBody.description"
        class="request-body-description">
        <MarkdownRenderer :value="prop.requestBody.description" />
      </div>
    </div>
    <div
      v-if="prop?.requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        noncollapsible
        :value="prop?.requestBody.content?.[selectedContentType]?.schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  display: flex;
  align-items: center;
  font-size: var(--scalar-heading-4);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  line-height: 1.45;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--scalar-border-color);
  flex-flow: wrap;
}
.request-body-title-select {
  position: relative;
  padding-left: 9px;
  height: fit-content;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  display: flex;
  align-items: center;
}
.request-body-title-no-select.request-body-title-select {
  pointer-events: none;
}
.request-body-title-no-select.request-body-title-select:after {
  display: none;
}
.request-body-title-select span {
  display: flex;
  align-items: center;
}
.request-body-title-select:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -4px, 0);
  display: block;
  margin-left: 7px;
  box-shadow: 1px 1px 0 currentColor;
}
.request-body-title-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-background-3);
  box-shadow: -2px 0 0 0 var(--scalar-background-3);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  appearance: none;
}
.request-body-title-select:hover {
  color: var(--scalar-color-1);
}
.request-body-description {
  margin-top: 6px;
  font-size: var(--scalar-small);
  width: 100%;
}
.request-body-description :deep(.markdown) * {
  color: var(--scalar-color-2) !important;
}
@media (max-width: 460px) {
  .request-body-title-select {
    margin-left: auto;
    padding-right: 3px;
  }
}
</style>
