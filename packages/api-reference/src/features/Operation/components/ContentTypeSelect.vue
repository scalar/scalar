<script setup lang="ts">
import type { ContentType, RequestBody } from '@scalar/types/legacy'
import { computed, ref } from 'vue'

const prop = defineProps<{
  requestBody?: RequestBody
  defaultValue?: ContentType
}>()

const emit = defineEmits<{
  (e: 'selectContentType', payload: { contentType: ContentType }): void
}>()

const handleSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const contentType = target.value as ContentType

  selectedContentType.value = contentType

  emit('selectContentType', { contentType })
}

const contentTypes = computed(() => {
  if (prop.requestBody?.content) {
    return Object.keys(prop.requestBody.content)
  }
  return []
})

const selectedContentType = ref<ContentType>(
  prop.defaultValue || (contentTypes.value[0] as ContentType),
)
</script>
<template>
  <div
    class="content-type-select"
    :class="{ 'content-type-no-select': contentTypes.length <= 1 }">
    <span>{{ selectedContentType }}</span>
    <select
      v-if="prop?.requestBody && contentTypes.length > 1"
      :value="selectedContentType"
      @change="handleSelectChange($event)">
      <option
        v-for="(_, key) in prop.requestBody?.content"
        :key="key"
        :value="key">
        {{ key }}
      </option>
    </select>
  </div>
</template>
<style scoped>
.content-type {
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
.content-type-select {
  position: relative;
  padding-left: 9px;
  height: fit-content;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  display: flex;
  align-items: center;
}
.content-type-no-select.content-type-select {
  pointer-events: none;
}
.content-type-no-select.content-type-select:after {
  display: none;
}
.content-type-select span {
  display: flex;
  align-items: center;
}
.content-type-select:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -4px, 0);
  display: block;
  margin-left: 7px;
  box-shadow: 1px 1px 0 currentColor;
}
.content-type-select select {
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
.content-type-select:hover {
  color: var(--scalar-color-1);
}
@media (max-width: 460px) {
  .content-type-select {
    margin-left: auto;
    padding-right: 3px;
  }
}
</style>
