<script lang="ts" setup>
import { ref } from 'vue'

import { type Server as ServerType } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import Server from './Server.vue'

defineProps<{
  value: ServerType[]
}>()

const selectedServerIndex = ref<number>(0)
</script>

<template>
  <Card v-if="value.length > 0">
    <CardHeader muted>Base URL</CardHeader>
    <CardContent muted>
      <div
        v-if="value[selectedServerIndex].description"
        class="variable-description">
        <MarkdownRenderer :value="value[selectedServerIndex].description" />
      </div>
    </CardContent>
    <CardContent
      v-if="value.length === 1"
      muted>
      <Server :value="value[selectedServerIndex]" />
    </CardContent>
    <CardContent
      v-if="value.length > 1"
      muted>
      <div class="server-selector">
        <select
          :value="selectedServerIndex"
          @input="(event) => (selectedServerIndex = parseInt((event.target as HTMLSelectElement).value, 10))">
          <option
            v-for="(server, index) in value"
            :key="index"
            :value="index">
            {{ server.url }}
          </option>
        </select>

        <Server :value="value[selectedServerIndex]" />
      </div>
    </CardContent>
    <CardContent v-if="value[selectedServerIndex].variables">
      <div
        v-for="(variable, name) in value[selectedServerIndex].variables"
        :key="name">
        <div class="input">
          <label :for="`variable-${name}`">
            {{ `\{${name}\}` }}
          </label>
          <template v-if="variable.enum">
            <select
              :id="`variable-${name}`"
              :value="variable.default ?? ''">
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
              :value="variable.default ?? ''" />
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
