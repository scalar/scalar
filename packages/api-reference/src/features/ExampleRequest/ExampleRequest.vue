<script setup lang="ts">
import { useExampleStore } from '#legacy'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/Card'
import { HttpMethod } from '@/components/HttpMethod'
import ScreenReader from '@/components/ScreenReader.vue'
import { type HttpClientState, useHttpClientStore } from '@/stores'
import { CodeSnippet } from '@scalar/api-client/views/Components/CodeSnippet'
import { ScalarCodeBlock } from '@scalar/components'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { computed, ref, useId, watch } from 'vue'

import ExamplePicker from './ExamplePicker.vue'
import TextSelect from './TextSelect.vue'

const { operation, server, securitySchemes, examples } = defineProps<{
  operation: Operation
  server?: Server
  /** Show a simplified card if no example are available */
  fallback?: boolean
  examples?: RequestExample[]
  securitySchemes?: SecurityScheme[]
}>()

const { selectedExampleKey, operationId } = useExampleStore()

const {
  httpClient,
  setHttpClient,
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
} = useHttpClientStore()

const id = useId()

const customCodeExamples = computed(() => {
  const keys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples'] as const

  for (const key of keys) {
    if (key in operation && operation[key]) {
      return Object.values(operation[key])
    }
  }

  return []
})

/** Use the selected custom example or the globally selected HTTP client */
const localHttpClient = ref<
  | HttpClientState
  | {
      targetKey: 'customExamples'
      clientKey: number
    }
>(
  // Default to first custom example
  customCodeExamples.value.length
    ? {
        targetKey: 'customExamples',
        clientKey: 0,
      }
    : // Otherwise use the globally selected HTTP client
      {
        targetKey: httpClient.targetKey,
        clientKey: httpClient.clientKey,
      },
)

// Overwrite the locally selected HTTP client when the global one changes
watch(httpClient, () => {
  localHttpClient.value = {
    targetKey: httpClient.targetKey,
    clientKey: httpClient.clientKey,
  }
})

const hasMultipleExamples = computed<boolean>(() => (examples?.length ?? 0) > 1)

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(() =>
  securitySchemes?.map((scheme) => {
    if (scheme.type === 'apiKey') return scheme.value
    if (scheme?.type === 'http')
      return [
        scheme.token,
        scheme.password,
        btoa(`${scheme.username}:${scheme.password}`),
      ]
    if (scheme.type === 'oauth2')
      return Object.values(scheme.flows).map((flow) => flow.token)

    return []
  }),
)

type TextSelectOptions = InstanceType<typeof TextSelect>['$props']['options']

/** All options for the dropdown */
const options = computed<TextSelectOptions>(() => {
  // Add available the client libraries
  const entries: TextSelectOptions = availableTargets.value.map((target) => {
    return {
      value: target.key,
      label: target.title,
      options: target.clients.map((c) => {
        return {
          value: JSON.stringify({
            targetKey: target.key,
            clientKey: c.client,
          }),
          label: c.title,
        }
      }),
    }
  })

  // Add entries for custom examples if any are available
  if (customCodeExamples.value.length)
    entries.unshift({
      value: 'customExamples',
      label: 'Examples',
      options: customCodeExamples.value.map((example, index) => ({
        value: JSON.stringify({
          targetKey: 'customExamples',
          clientKey: index,
        }),
        label: example.label ?? example.lang ?? `Example #${index + 1}`,
      })),
    })

  return entries
})

/** Set custom example, or update the selected HTTP client globally */
function updateHttpClient(value: string) {
  const data = JSON.parse(value)

  if (data.targetKey === 'customExamples') {
    localHttpClient.value = data
  } else {
    setHttpClient(data)
  }
}
</script>
<template>
  <Card
    v-if="availableTargets.length || customCodeExamples.length"
    class="dark-mode">
    <CardHeader muted>
      <div
        :id="`${id}-header`"
        class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.method" />
        <slot name="header" />
      </div>
      <template #actions>
        <TextSelect
          class="request-client-picker"
          :controls="`${id}-example`"
          :modelValue="JSON.stringify(localHttpClient)"
          :options="options"
          @update:modelValue="updateHttpClient">
          <template v-if="localHttpClient.targetKey === 'customExamples'">
            <ScreenReader>Selected Example:</ScreenReader>
            {{
              customCodeExamples[localHttpClient.clientKey].label ?? 'Example'
            }}
          </template>
          <template v-else>
            <ScreenReader>Selected HTTP client:</ScreenReader>
            {{ httpTargetTitle }}
            {{ httpClientTitle }}
          </template>
        </TextSelect>
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <!-- Multiple examples -->
      <div
        :id="`${id}-example`"
        class="code-snippet">
        <template v-if="localHttpClient.targetKey === 'customExamples'">
          <ScalarCodeBlock
            :content="customCodeExamples[localHttpClient.clientKey].source"
            copy
            :lang="customCodeExamples[localHttpClient.clientKey].lang"
            lineNumbers />
        </template>
        <template v-else>
          <CodeSnippet
            :client="httpClient.clientKey"
            :example="examples?.[0]"
            :operation="operation"
            :secretCredentials="secretCredentials"
            :securitySchemes="securitySchemes"
            :server="server"
            :target="httpClient.targetKey" />
        </template>
      </div>
    </CardContent>
    <CardFooter
      v-if="hasMultipleExamples || $slots.footer"
      class="request-card-footer"
      contrast>
      <div
        v-if="hasMultipleExamples"
        class="request-card-footer-addon">
        <!-- TODO: Add multiple examples -->
        <!-- transformedOperation.information?.requestBody?.content?.[
            'application/json'
          ]?.examples ?? [] -->
        <ExamplePicker
          class="request-example-selector"
          :examples="[]"
          @update:modelValue="
            (value) => (
              (selectedExampleKey = value),
              (operationId = operation.operationId)
            )
          " />
      </div>
      <slot name="footer" />
    </CardFooter>
  </Card>
  <Card
    v-else-if="fallback"
    class="dark-mode">
    <CardContent class="request-card-simple">
      <div class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.method" />
        <slot name="header" />
      </div>
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
<style scoped>
.request {
  display: flex;
  flex-wrap: nowrap;
}
.request-header {
  display: flex;
  gap: 6px;
  text-transform: initial;
}
.request-method {
  font-family: var(--scalar-font-code);
  text-transform: uppercase;
}
.request-client-picker {
  padding-left: 12px;
  padding-right: 9px;
}
.request-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px;
  flex-shrink: 0;
}
.request-card-footer-addon {
  display: flex;
  align-items: center;

  flex: 1;
  min-width: 0;
}
.request-editor-section {
  display: flex;
  flex: 1;
}
.request-card-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 8px 8px 12px;

  font-size: var(--scalar-small);
}
.code-snippet {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
