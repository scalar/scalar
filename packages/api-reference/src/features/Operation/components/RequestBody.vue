<script setup lang="ts">
import { Schema } from '@/components/Content/Schema'
import { ScalarMarkdown } from '@scalar/components'
import type { ContentType, RequestBody } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

const { requestBody } = defineProps<{ requestBody?: RequestBody }>()

const availableContentTypes = computed(() =>
  Object.keys(requestBody?.content ?? {}),
)

const selectedContentType = ref<ContentType>('application/json')

if (requestBody?.content) {
  if (availableContentTypes.value.length > 0) {
    selectedContentType.value = availableContentTypes.value[0] as ContentType
  }
}
</script>
<template>
  <div v-if="requestBody">
    <div class="request-body-title">
      <slot name="title" />
      <div
        class="request-body-title-select"
        :class="{
          'request-body-title-no-select': availableContentTypes.length <= 1,
        }">
        <span>{{ selectedContentType }}</span>
        <select
          v-if="requestBody && availableContentTypes.length > 1"
          v-model="selectedContentType">
          <option
            v-for="(_, key) in requestBody?.content"
            :key="key"
            :value="key">
            {{ key }}
          </option>
        </select>
      </div>
      <div
        v-if="requestBody.description"
        class="request-body-description">
        <ScalarMarkdown :value="requestBody.description" />
      </div>
    </div>
    <div
      v-if="requestBody.content?.[selectedContentType]"
      class="request-body-schema">
      <Schema
        compact
        noncollapsible
        :value="requestBody.content?.[selectedContentType]?.schema" />
    </div>
  </div>
</template>

<style scoped>
.request-body-title {
  display: flex;
  align-items: center;
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  line-height: 1.45;
  margin-top: 24px;
  padding-bottom: 12px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  flex-flow: wrap;
}
.request-body-title-select {
  position: relative;
  height: fit-content;
  margin-left: auto;
  font-weight: var(--scalar-regular);
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-2);
  padding: 2px 6px;
  border-radius: 12px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.request-body-title-no-select.request-body-title-select {
  pointer-events: none;
}
.request-body-title-no-select {
  border: none;
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
  width: 6px;
  height: 6px;
  transform: rotate(45deg) translate3d(0, -3px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
  margin-right: 5px;
}
.request-body-title-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-background-3);
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
