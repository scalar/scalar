<script lang="ts" setup>
import { ref, watch } from 'vue'

import { useGlobalStore } from '../../../stores'
import { type Server } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
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
      variables: prefilledVariables,
    })
  },
  {
    immediate: true,
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
    <CardContent muted>
      <div
        v-if="value[selectedServerIndex].description"
        class="variable-description">
        <MarkdownRenderer :value="value[selectedServerIndex].description" />
      </div>
    </CardContent>
    <!-- Single URL -->
    <CardContent
      v-if="value.length === 1"
      muted>
      <ServerItem :value="value[selectedServerIndex]" />
    </CardContent>
    <!-- Multiple URLs -->
    <CardContent
      v-if="value.length > 1"
      muted>
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

        <ServerItem :value="value[selectedServerIndex]" />
      </div>
    </CardContent>
    <!-- Variables -->
    <CardContent v-if="value[selectedServerIndex].variables">
      <div
        v-for="(variable, name) in value[selectedServerIndex].variables"
        :key="name">
        <div class="input">
          <label :for="`variable-${name}`">
            <code>{{ `\{${name}\}` }}</code>
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
    </CardContent>
  </Card>
</template>

<style scoped>
.server-selector {
  position: relative;
  outline: 1px solid red;
}

.server-selector select {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  top: 0;
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

.input {
  align-items: center;
}
</style>
