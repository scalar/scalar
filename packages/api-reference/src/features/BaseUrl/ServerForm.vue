<script lang="ts" setup>
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import { computed, toRef } from 'vue'

import ServerItem from './ServerItem.vue'
import ServerVariablesForm from './ServerVariablesForm.vue'
import type { Server, ServerVariableValues } from './types'

const props = withDefaults(
  defineProps<{
    selected?: number
    servers?: Server[]
    variables?: ServerVariableValues
  }>(),
  {
    selected: 0,
  },
)

const emit = defineEmits<{
  (e: 'update:selected', v: number): void
  (e: 'update:variable', name: string, value: string): void
}>()

// Keep local reference to the selected server, so updates work without the prop, too.
const selectedRef = toRef(props.selected)

const updateSelectedIndex = (event: Event) => {
  const newIndex = parseInt((event.target as HTMLSelectElement).value, 10)

  emit('update:selected', newIndex)
  selectedRef.value = newIndex
}

// Alias
const server = computed(() => props.servers?.[selectedRef.value])
</script>

<template>
  <div v-if="servers && servers.length > 0">
    <span class="server-form-title">Base URL</span>
    <div class="server-form">
      <div class="server-form-container">
        <!-- Multiple URLs -->
        <div class="server-item">
          <div class="server-selector">
            <select
              v-if="servers && servers.length > 1"
              :value="selectedRef"
              @input="updateSelectedIndex">
              <option
                v-for="(serverOption, index) in servers"
                :key="index"
                :value="index">
                {{ serverOption.url }}
              </option>
            </select>

            <ServerItem
              :server="server"
              :variables="variables" />

            <ScalarIcon
              v-if="servers.length > 1"
              icon="ChevronDown" />
          </div>
        </div>
        <!-- Variables -->
        <ServerVariablesForm
          :values="variables"
          :variables="server?.variables"
          @update:variable="
            (name, value) => $emit('update:variable', name, value)
          " />
      </div>
    </div>
    <!-- Description -->
    <div
      v-if="server?.description"
      muted>
      <div class="description">
        <ScalarMarkdown :value="server.description" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-item {
  padding: 0 9px;
}
.server-selector {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  gap: 2px;
  color: var(--scalar-color-2);
}

.description {
  padding: 6px 12px;
  font-size: var(--scalar-small);
}
.description :deep(.markdown) {
  font-size: var(--scalar-micro);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color--1);
  padding: 4px 0;
  display: block;
}
.description :deep(.markdown > *:first-child) {
  margin-top: 0;
}

.server-selector select {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  top: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}

.server-selector svg {
  width: 12px;
}
.server-form {
  margin-top: 6px;
}
.server-form-container {
  /* margin: 9px; */
  box-shadow: 0 0 0 1px var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.server-form-title {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-3);
  text-transform: uppercase;
  display: block;
}
</style>
