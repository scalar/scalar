<script setup lang="ts">
import { useExampleStore } from '#legacy'
import { createRequestOperation } from '@scalar/api-client/libs'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import { ScalarCodeBlock } from '@scalar/components'
import { createHash, ssrState } from '@scalar/oas-utils/helpers'
import type {
  ExampleRequestSSRKey,
  SSRState,
  TransformedOperation,
} from '@scalar/types/legacy'
import { asyncComputed } from '@vueuse/core'
import {
  computed,
  onServerPrefetch,
  ref,
  useId,
  useSSRContext,
  watch,
} from 'vue'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '../../components/Card'
import { HttpMethod } from '../../components/HttpMethod'
import ScreenReader from '../../components/ScreenReader.vue'
import { getExampleCode } from '../../helpers'
import { type HttpClientState, useHttpClientStore } from '../../stores'
import ExamplePicker from './ExamplePicker.vue'
import TextSelect from './TextSelect.vue'

const props = defineProps<{
  operation: TransformedOperation
  /** Show a simplified card if no example are available */
  fallback?: boolean
}>()

const ssrHash = createHash(
  props.operation.path + props.operation.httpVerb + props.operation.operationId,
)
const ssrStateKey =
  `components-Content-Operation-Example-Request${ssrHash}` satisfies ExampleRequestSSRKey

const { selectedExampleKey, operationId } = useExampleStore()
const { activeCollection, activeServer, activeWorkspace } = useActiveEntities()
const { requests, requestExamples, securitySchemes } = useWorkspace()

const {
  httpClient,
  setHttpClient,
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
} = useHttpClientStore()

const id = useId()

const customRequestExamples = computed(() => {
  const keys = ['x-custom-examples', 'x-codeSamples', 'x-code-samples'] as const

  for (const key of keys) {
    if (props.operation.information?.[key]) {
      const examples = [...props.operation.information[key]]
      return examples
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
  customRequestExamples.value.length
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

const hasMultipleExamples = computed<boolean>(
  () =>
    Object.keys(
      props.operation.information?.requestBody?.content?.['application/json']
        ?.examples ?? {},
    ).length > 1,
)

/** Current request */
const request = computed(() => {
  const requestsArr = Object.values(requests)
  if (!requestsArr.length) return null

  return requestsArr.find(
    ({ method, path }) =>
      method === props.operation.httpVerb.toLowerCase() &&
      path === props.operation.path,
  )
})

/** Just grab the first example for now */
const requestExample = computed(() =>
  request.value ? requestExamples[request.value.examples[0]] : null,
)

/** Selected security scheme uids restircted by what is required by the request */
const selectedSecuritySchemeUids = computed(() => {
  // Grab the required uids
  const requirementObjects =
    request.value?.security ?? activeCollection.value?.security ?? []
  const filteredObjects = requirementObjects.filter(
    (r) => Object.keys(r).length,
  )
  const filteredKeys = filteredObjects.map((r) => Object.keys(r)[0])

  // We have an empty object so any auth will work
  if (filteredObjects.length < requirementObjects.length) {
    return activeCollection.value?.selectedSecuritySchemeUids ?? []
  }
  // Otherwise filter the selected uids by what is required by this request
  else {
    const _securitySchemes = Object.values(securitySchemes)
    const requirementUids = filteredKeys
      .map((name) => _securitySchemes.find((s) => s.nameKey === name)?.uid)
      .filter(Boolean)

    return activeCollection.value?.selectedSecuritySchemeUids.filter((uid) =>
      requirementUids.find((fuid) => fuid === uid),
    )
  }
})

/** Generates an array of secrets we want to hide in the code block */
const secretCredentials = computed(() =>
  selectedSecuritySchemeUids.value?.flatMap((uid) => {
    const scheme = securitySchemes[uid]
    if (scheme?.type === 'apiKey') return scheme.value
    if (scheme?.type === 'http')
      return [
        scheme.token,
        scheme.password,
        btoa(`${scheme.username}:${scheme.password}`),
      ]
    if (scheme?.type === 'oauth2')
      return Object.values(scheme.flows).map((flow) => flow.token)

    return []
  }),
)

const generateSnippet = async () => {
  // Use the selected custom example
  if (localHttpClient.value.targetKey === 'customExamples') {
    return (
      customRequestExamples.value[localHttpClient.value.clientKey]?.source ?? ''
    )
  }
  if (!request.value || !requestExample.value) return ''

  // Generate a request object
  const [error, response] = createRequestOperation({
    request: request.value,
    example: requestExample.value,
    server: activeServer.value,
    securitySchemes,
    selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
    proxy: activeWorkspace.value.proxyUrl,
    // TODO: env vars if we want em
    environment: {},
    // TODO: cookies if we want em
    globalCookies: [],
  })

  if (error) {
    console.error('[generateSnippet]', error)
    return ''
  }

  const clientKey = httpClient.clientKey
  const targetKey = httpClient.targetKey

  return (
    (await getExampleCode(response.request, targetKey, clientKey as string)) ??
    ''
  )
}

const generatedCode = asyncComputed<string>(async () => {
  try {
    return await generateSnippet()
  } catch (error) {
    console.error('[generateSnippet]', error)
    return ''
  }
}, ssrState[ssrStateKey] ?? '')

onServerPrefetch(async () => {
  const ctx = useSSRContext<SSRState>()
  ctx!.payload.data[ssrStateKey] = await generateSnippet()
})

/** Code language of the snippet */
const language = computed(() => {
  const key =
    // Specified language
    localHttpClient.value?.targetKey === 'customExamples'
      ? (customRequestExamples.value[localHttpClient.value.clientKey]?.lang ??
        'plaintext')
      : // Or language for the globally selected HTTP client
        httpClient.targetKey

  // Normalize language
  if (key === 'shell' && generatedCode.value.includes('curl')) return 'curl'
  if (key === 'Objective-C') return 'objc'

  return key
})

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
            clientKey: c.key,
          }),
          label: c.title,
        }
      }),
    }
  })

  // Add entries for custom examples if any are available
  if (customRequestExamples.value.length)
    entries.unshift({
      value: 'customExamples',
      label: 'Examples',
      options: customRequestExamples.value.map((example, index) => ({
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
    v-if="availableTargets.length || customRequestExamples.length"
    class="dark-mode">
    <CardHeader muted>
      <div
        :id="`${id}-header`"
        class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.httpVerb" />
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
              customRequestExamples[localHttpClient.clientKey].label ??
              'Example'
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
        <ScalarCodeBlock
          class="bg-b-2"
          :content="generatedCode"
          :hideCredentials="secretCredentials"
          :lang="language"
          lineNumbers />
      </div>
    </CardContent>
    <CardFooter
      v-if="hasMultipleExamples || $slots.footer"
      class="request-card-footer"
      contrast>
      <div
        v-if="hasMultipleExamples"
        class="request-card-footer-addon">
        <ExamplePicker
          class="request-example-selector"
          :examples="
            operation.information?.requestBody?.content?.['application/json']
              ?.examples ?? []
          "
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
          :method="operation.httpVerb" />
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
