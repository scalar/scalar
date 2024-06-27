<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'
import { computed, toRef } from 'vue'

import ServerUrl from './ServerUrl.vue'
import ServerUrlSelect from './ServerUrlSelect.vue'
import ServerVariablesForm from './ServerVariablesForm.vue'
import type { Server, ServerVariableValues } from './types'

const props = withDefaults(
  defineProps<{
    selected?: string | number
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

/** Keep local reference to the selected server, so updates work without the prop, too. */
const selectedRef = toRef<number>(Number(props.selected))

const updateSelectedIndex = (value: string) => {
  const newIndex = parseInt(value, 10)

  emit('update:selected', newIndex)
  selectedRef.value = newIndex
}

/** Selected server */
const server = computed(() => props.servers?.[selectedRef.value])
</script>

<template>
  <div v-if="servers?.length">
    <span class="server-form-title">Base URL</span>
    <div class="server-form">
      <div class="server-form-container">
        <!-- Dropdown -->
        <div class="server-item">
          <ServerUrlSelect
            :options="servers"
            :value="selectedRef"
            @change="updateSelectedIndex">
            <ServerUrl
              :server="server"
              :variables="variables" />
          </ServerUrlSelect>
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
.server-form-title {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color-3);
  text-transform: uppercase;
  display: block;
}
.server-form {
  margin-top: 6px;
}
.server-form-container {
  box-shadow: 0 0 0 1px var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
.server-item {
  padding: 0 9px;
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
</style>
