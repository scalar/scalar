<script setup lang="ts">
import {
  getRequestFromAuthentication,
  getSecretCredentialsFromAuthentication,
  getUrlFromServerState,
  useAuthenticationStore,
  useServerStore,
} from '#legacy'
import { ScalarCodeBlock } from '@scalar/components'
import { createHash, ssrState } from '@scalar/oas-utils/helpers'
import { getRequestFromOperation } from '@scalar/oas-utils/spec-getters'
import { snippetz } from '@scalar/snippetz'
import type {
  CustomRequestExample,
  ExampleRequestSSRKey,
  SSRState,
  TransformedOperation,
} from '@scalar/types/legacy'
import { asyncComputed } from '@vueuse/core'
import {
  computed,
  inject,
  onServerPrefetch,
  ref,
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
import {
  GLOBAL_SECURITY_SYMBOL,
  getApiClientRequest,
  getHarRequest,
} from '../../helpers'
import { type HttpClientState, useHttpClientStore } from '../../stores'
import ExamplePicker from './ExamplePicker.vue'
import TextSelect from './TextSelect.vue'

const props = defineProps<{
  customExamples?: CustomRequestExample[] | null
  operation: TransformedOperation
}>()

const ssrHash = createHash(
  props.operation.path + props.operation.httpVerb + props.operation.operationId,
)
const ssrStateKey =
  `components-Content-Operation-Example-Request${ssrHash}` satisfies ExampleRequestSSRKey

const selectedExampleKey = ref<string>()

const {
  httpClient,
  setHttpClient,
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
} = useHttpClientStore()

const { server: serverState } = useServerStore()
const { authentication: authenticationState } = useAuthenticationStore()

/** Use the selected custom example or the globally selected HTTP client */
const localHttpClient = ref<
  | HttpClientState
  | {
      targetKey: 'customExamples'
      clientKey: number
    }
>(
  // Default to first custom example
  props.customExamples?.length
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

const getGlobalSecurity = inject(GLOBAL_SECURITY_SYMBOL)

async function generateSnippet() {
  // Use the selected custom example
  if (localHttpClient.value.targetKey === 'customExamples') {
    return props.customExamples?.[localHttpClient.value.clientKey]?.source ?? ''
  }

  // Generate a request object
  const request = getHarRequest(
    {
      url: getUrlFromServerState(serverState),
    },
    getRequestFromOperation(
      props.operation,
      {
        replaceVariables: true,
      },
      selectedExampleKey.value,
    ),
    getRequestFromAuthentication(
      authenticationState,
      props.operation.information?.security ?? getGlobalSecurity?.(),
    ),
  )

  const clientKey =
    httpClient.clientKey === 'undici' ||
    httpClient.clientKey === 'fetch' ||
    httpClient.clientKey === 'ofetch'
      ? httpClient.clientKey
      : null

  const targetKey = httpClient.targetKey.replace('javascript', 'js')

  if (
    clientKey &&
    snippetz().hasPlugin(targetKey, clientKey) &&
    (targetKey === 'node' || targetKey === 'js')
  ) {
    return snippetz().print(targetKey, clientKey, request as any) ?? ''
  }

  // Use httpsnippet-lite for other languages
  try {
    return (await snippetz().convert(
      httpClient.targetKey,
      httpClient.clientKey,
      request,
    )) as string
  } catch (e) {
    console.error('[ExampleRequest]', e)
    return ''
  }
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

/** @hans TODO What is this doing? Computed properties should not be used as side effects  */
computed(() => {
  return getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: props.operation,
    globalSecurity: getGlobalSecurity?.(),
  })
})

/** Code language of the snippet */
const language = computed(() => {
  const key =
    // Specified language
    localHttpClient.value?.targetKey === 'customExamples'
      ? props.customExamples?.[localHttpClient.value.clientKey]?.lang ??
        'plaintext'
      : // Or language for the globally selected HTTP client
        httpClient.targetKey

  // Normalize language
  if (key === 'shell' && generatedCode.value.includes('curl')) return 'curl'
  if (key === 'Objective-C') return 'objc'

  return key
})

/** All options for the dropdown */
const options = computed(() => {
  // Add available the client libraries
  const entries: {
    value: string
    label: string
    options: { value: string; label: string }[]
  }[] = availableTargets.value.map((target) => {
    return {
      value: target.key,
      label: target.title,
      options: target.clients.map((client) => {
        return {
          value: JSON.stringify({
            targetKey: target.key,
            clientKey: client.key,
          }),
          label: client.title,
        }
      }),
    }
  })

  // Add entries for all available custom examples
  if (props.customExamples?.length) {
    entries.unshift({
      value: 'customExamples',
      label: 'Examples',
      options: props.customExamples.map((example, index) => {
        return {
          value: JSON.stringify({
            targetKey: 'customExamples',
            clientKey: index,
          }),
          label: example.label ?? example.lang ?? `Example #${index + 1}`,
        }
      }),
    })
  }

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
  <Card class="dark-mode">
    <CardHeader muted>
      <div class="request-header">
        <HttpMethod
          as="span"
          class="request-method"
          :method="operation.httpVerb" />
        <slot name="header" />
      </div>
      <template #actions>
        <TextSelect
          class="request-client-picker"
          :modelValue="JSON.stringify(localHttpClient)"
          :options="options"
          @update:modelValue="updateHttpClient">
          <template v-if="localHttpClient.targetKey === 'customExamples'">
            {{
              props.customExamples?.[localHttpClient.clientKey].label ??
              'Example'
            }}
          </template>
          <template v-else>
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
      <div class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2"
          :content="generatedCode"
          :hideCredentials="
            getSecretCredentialsFromAuthentication(authenticationState)
          "
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
          @update:modelValue="(value) => (selectedExampleKey = value)" />
      </div>
      <slot name="footer" />
    </CardFooter>
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
.code-snippet {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
