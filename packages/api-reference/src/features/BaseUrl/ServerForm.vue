<script lang="ts" setup>
import { ScalarMarkdown } from '@scalar/components'
import type { Server } from '@scalar/types/legacy'
import { nanoid } from 'nanoid'
import { computed } from 'vue'

import ServerUrl from './ServerUrl.vue'
import ServerUrlSelect from './ServerUrlSelect.vue'
import ServerVariablesForm from './ServerVariablesForm.vue'
import type { ServerVariableValues } from './types'

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
  (e: 'update:variables', v: ServerVariableValues): void
}>()

const selectorId = `server-selector-${nanoid()}`
const descriptionId = `server-description-${nanoid()}`

const selectedIndex = computed<number>({
  get: () => props.selected,
  set: (v) => emit('update:selected', v),
})

/** Selected server */
const server = computed(() => props.servers?.[selectedIndex.value])

function updateVariable(name: string, value: string) {
  emit('update:variables', { ...props.variables, [name]: value })
}
</script>

<template>
  <div v-if="servers?.length">
    <label class="server-form-title">Server</label>
    <div class="server-form">
      <div class="server-form-container">
        <!-- Dropdown -->
        <div>
          <ServerUrlSelect
            :id="selectorId"
            v-model="selectedIndex"
            :describedBy="descriptionId"
            label="Base URL"
            :options="servers">
            <span class="sr-only">Selected:</span>
            <ServerUrl
              :server="server"
              :variables="variables" />
          </ServerUrlSelect>
        </div>
        <!-- Variables -->
        <ServerVariablesForm
          :controls="selectorId"
          :values="variables"
          :variables="server?.variables"
          @update:variable="updateVariable" />
      </div>
    </div>
    <!-- Description -->
    <div
      v-if="server?.description"
      :id="descriptionId"
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
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}
.description {
  padding: 6px 12px;
  font-size: var(--scalar-small);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-3);
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
