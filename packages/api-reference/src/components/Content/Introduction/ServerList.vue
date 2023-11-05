<script lang="ts" setup>
import { ref, watch } from 'vue'

import { useGlobalStore } from '../../../stores'
import { type Server } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import { FlowIcon } from '../../Icon'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import ServerItem from './ServerItem.vue'

const props = defineProps<{
  value: Server[]
}>()

const { server, setServer } = useGlobalStore()
const selectedServerIndex = ref<number>(0)

watch(
  selectedServerIndex,
  () => {
    const variables = props.value[selectedServerIndex.value]?.variables

    const prefilledVariables = variables
      ? Object.keys(variables).map((name) => {
          return {
            name: name,
            value: variables[name].default ?? '',
          }
        })
      : []

    setServer({
      selectedServer: selectedServerIndex.value,
      servers: props.value,
      variables: prefilledVariables,
    })
  },
  {
    immediate: true,
  },
)

watch(
  () => props.value,
  () => {
    setServer({
      servers: props.value,
    })
  },
)

const handleInput = (name: string, event: Event) => {
  const newValue = (event.target as HTMLSelectElement).value
  const newVariables = [...server.variables]
  const index = newVariables.findIndex((variable) => variable.name === name)

  newVariables[index].value = newValue

  setServer({
    variables: newVariables,
  })
}

const getValue = (name: string) => {
  const index = server.variables.findIndex((variable) => variable.name === name)

  return server.variables[index].value ?? ''
}
</script>

<template>
  <Card v-if="value.length > 0">
    <CardHeader muted>Base URL</CardHeader>
    <!-- <CardContent>
      {{ server }}
    </CardContent> -->
    <!-- Single URL -->
    <CardContent
      v-if="value.length === 1"
      muted>
      <div class="server-item">
        <ServerItem
          :value="value[selectedServerIndex]"
          :variables="server.variables" />
      </div>
    </CardContent>
    <CardContent
      v-if="value.length > 1"
      class="scalar-card-serverlist">
      <div class="scalar-card-serverlist-container">
        <!-- Multiple URLs -->
        <div class="server-item">
          <div class="server-selector">
            <select
              :value="selectedServerIndex"
              @input="(event) => (selectedServerIndex = parseInt((event.target as HTMLSelectElement).value, 10))">
              <option
                v-for="(serverOption, index) in value"
                :key="index"
                :value="index">
                {{ serverOption.url }}
              </option>
            </select>

            <ServerItem
              :value="value[selectedServerIndex]"
              :variables="server.variables" />

            <FlowIcon icon="ChevronDown" />
          </div>
        </div>
        <!-- Variables -->
        <div v-if="value[selectedServerIndex].variables">
          <div
            v-for="(variable, name) in value[selectedServerIndex].variables"
            :key="name"
            class="input">
            <label :for="`variable-${name}`">
              <code>{{ name }}</code>
            </label>
            <template v-if="variable.enum">
              <select
                :id="`variable-${name}`"
                :value="getValue(name)"
                @input="(event) => handleInput(name, event)">
                <option
                  v-for="enumValue in variable.enum"
                  :key="enumValue"
                  :value="enumValue">
                  {{ enumValue }}
                </option>
              </select>
              <div class="input-value">
                {{ variable.default }}
              </div>
            </template>
            <template v-else>
              <input
                :id="`variable-${name}`"
                autocomplete="off"
                placeholder="value"
                spellcheck="false"
                type="text"
                :value="getValue(name)"
                @input="(event) => handleInput(name, event)" />
            </template>
          </div>
        </div>
      </div>
    </CardContent>
    <!-- Description -->
    <CardContent
      v-if="value[selectedServerIndex].description"
      muted>
      <div class="variable-description">
        <MarkdownRenderer :value="value[selectedServerIndex].description" />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.server-item {
  padding: 0 9px;
}
.server-item .base-url:first-child:last-child {
  padding: 11px 3px;
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.server-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.server-selector select {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  top: 0;
}

.server-selector svg {
  width: 12px;
}

.input select {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
}

.input-value {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-micro, var(--default-theme-micro));
  padding: 9px;
}

.variable-description {
  padding: 6px 12px;
  font-size: var(--theme-small, var(--default-theme-small));
}
.variable-description :deep(.markdown) {
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color--1, var(--default-theme-color-1));
  padding: 4px 0;
  display: block;
}
.variable-description :deep(div > *:first-child) {
  margin-top: 0 !important;
}
.input {
  align-items: center;
}
.scalar-card-serverlist {
  padding: 9px;
}
.scalar-card-serverlist-container {
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.scalar-card-serverlist-container .input:first-of-type {
  border-radius: 0;
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
