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
  <label
    class="content-type-select"
    :class="{ 'content-type-no-select': contentTypes.length <= 1 }">
    <span>{{ selectedContentType }}</span>
    <select
      v-if="prop?.requestBody && contentTypes.length > 1"
      :value="selectedContentType"
      @change="handleSelectChange($event)"
      @keydown.stop>
      <option
        v-for="(_, key) in prop.requestBody?.content"
        :key="key"
        :value="key"
        @keydown.stop>
        {{ key }}
      </option>
    </select>
  </label>
</template>
<style scoped>
.content-type {
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
.content-type-select {
  position: relative;
  height: fit-content;
  margin-left: auto;
  font-weight: var(--scalar-regular);
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-2);
  padding: 3px 6px 4px 8px;
  border-radius: 12px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}
.content-type-no-select.content-type-select {
  padding: 3px 8px 4px 8px;
  pointer-events: none;
}
.content-type-no-select {
  border: none;
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
  width: 6px;
  height: 6px;
  transform: rotate(45deg) translate3d(0, -3px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
  margin-right: 5px;
}
.content-type-select select {
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
.content-type-select:hover {
  color: var(--scalar-color-1);
}
.content-type-select:has(select:focus-visible) {
  outline: 1px solid var(--scalar-color-accent);
}
@media (max-width: 460px) {
  .content-type-select {
    margin-left: auto;
    padding-right: 3px;
  }
}
</style>
