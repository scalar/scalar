<script lang="ts" setup>
import { findVariables } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import { ref, watch } from 'vue'

import { useServerStore } from '../../../stores'
import type { Variable } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import { MarkdownRenderer } from '../../MarkdownRenderer'
import ServerItem from './ServerItem.vue'
import ServerVariables from './ServerVariables.vue'

const { server, setServer } = useServerStore()
const selectedServerIndex = ref<number>(0)

// TODO move this to a computed property in the store
watch(
  [selectedServerIndex, () => server.servers],
  () => {
    if (!server.servers.length) return

    // Add configured variables
    const variables = server.servers[selectedServerIndex.value]?.variables ?? {}

    const prefilledVariables: Variable[] = variables
      ? Object.keys(variables).map((name): Variable => {
          return {
            name: name,
            value: variables[name].default?.toString() ?? '',
          }
        })
      : []

    // Add variables found in the URL
    const foundVariables = findVariables(
      server.servers[selectedServerIndex.value]?.url,
    )

    foundVariables
      .filter((variable: string) => !variables[variable])
      .forEach((variable: string) => {
        prefilledVariables.push({
          name: variable,
          value: '',
        })
      })

    setServer({
      selectedServer: selectedServerIndex.value,
      description: server.servers[selectedServerIndex.value]?.description,
      variables: prefilledVariables,
    })
  },
  {
    deep: true,
  },
)
</script>

<template>
  <Card v-if="server.servers.length > 0">
    <CardHeader
      borderless
      muted>
      Base URL
    </CardHeader>
    <CardContent class="scalar-card-serverlist">
      <div class="scalar-card-serverlist-container">
        <!-- Multiple URLs -->
        <div class="server-item">
          <div class="server-selector">
            <select
              v-if="server.servers.length > 1"
              :value="selectedServerIndex"
              @input="
                (event) =>
                  (selectedServerIndex = parseInt(
                    (event.target as HTMLSelectElement).value,
                    10,
                  ))
              ">
              <option
                v-for="(serverOption, index) in server.servers"
                :key="index"
                :value="index">
                {{ serverOption.url }}
              </option>
            </select>

            <ServerItem
              :value="server.servers[selectedServerIndex]"
              :variables="server.variables" />

            <ScalarIcon
              v-if="server.servers.length > 1"
              icon="ChevronDown" />
          </div>
        </div>
        <!-- Variables -->
        <ServerVariables :value="server.variables" />
      </div>
    </CardContent>
    <!-- Description -->
    <CardContent
      v-if="server.description"
      muted>
      <div class="description">
        <MarkdownRenderer :value="server.description" />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.server-item {
  padding: 0 9px;
}
.scalar-card-serverlist {
  padding: 9px;
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

.scalar-card-serverlist-container {
  /* margin: 9px; */
  box-shadow: 0 0 0 1px var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
</style>
