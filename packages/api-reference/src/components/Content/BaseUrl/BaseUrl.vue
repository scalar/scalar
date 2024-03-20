<script lang="ts" setup>
import { findVariables } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import { ref, watch } from 'vue'

import { useServerStore } from '../../../stores'
import { type Server, type Variable } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import { MarkdownRenderer } from '../../MarkdownRenderer'
import ServerItem from './ServerItem.vue'
import ServerVariables from './ServerVariables.vue'

const props = defineProps<{
  value: Server[]
}>()

const { server, setServer } = useServerStore()
const selectedServerIndex = ref<number>(0)

watch(
  selectedServerIndex,
  () => {
    // Add configured variables
    const variables = props.value[selectedServerIndex.value]?.variables ?? {}

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
      props.value[selectedServerIndex.value]?.url,
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
      description: props.value[selectedServerIndex.value]?.description,
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
</script>

<template>
  <Card v-if="value.length > 0">
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
              v-if="value.length > 1"
              :value="selectedServerIndex"
              @input="
                (event) =>
                  (selectedServerIndex = parseInt(
                    (event.target as HTMLSelectElement).value,
                    10,
                  ))
              ">
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

            <ScalarIcon
              v-if="value.length > 1"
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
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.description {
  padding: 6px 12px;
  font-size: var(--theme-small, var(--default-theme-small));
}
.description :deep(.markdown) {
  font-size: var(--theme-micro, var(--default-theme-micro));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  color: var(--theme-color--1, var(--default-theme-color-1));
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
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
</style>
