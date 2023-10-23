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
            {{ `\{\{ ${name} \}\}` }}
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
          </template>
          <template v-else>
            <input
              :id="`variable-${name}`"
              autocomplete="off"
              placeholder="Generated Token"
              spellcheck="false"
              type="text"
              :value="variable.default ?? ''" />
          </template>
        </div>
        <!-- <div
          v-if="variable.description"
          class="variable-description">
          <MarkdownRenderer :value="variable.description" />
        </div> -->
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

.input-select {
  display: flex;
}
</style>
