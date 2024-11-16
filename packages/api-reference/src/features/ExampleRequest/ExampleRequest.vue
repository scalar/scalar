<script setup lang="ts">
import {
  getRequestFromAuthentication,
  getSecretCredentialsFromAuthentication,
  getUrlFromServerState,
  useExampleStore,
  useServerStore,
} from '#legacy'
import { ScalarCodeBlock } from '@scalar/components'
import { createHash, ssrState } from '@scalar/oas-utils/helpers'
import { getRequestFromOperation } from '@scalar/oas-utils/spec-getters'
import type {
  AuthenticationState,
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
import {
  AUTHENTICATION_SYMBOL,
  GLOBAL_SECURITY_SYMBOL,
  getExampleCode,
  getHarRequest,
} from '../../helpers'
import { type HttpClientState, useHttpClientStore } from '../../stores'
import { useApiClient } from '../ApiClientModal/useApiClient'
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

const {
  httpClient,
  setHttpClient,
  availableTargets,
  httpTargetTitle,
  httpClientTitle,
} = useHttpClientStore()

const id = useId()
const { client } = useApiClient()
const { server: serverState } = useServerStore()

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

const getGlobalSecurity = inject(GLOBAL_SECURITY_SYMBOL)
const getAuthentication = inject(AUTHENTICATION_SYMBOL)

const createEmptyAuthenticationState = (): AuthenticationState => ({
  preferredSecurityScheme: null,
  customSecurity: false,
  http: {
    basic: {
      username: '',
      password: '',
    },
    bearer: {
      token: '',
    },
  },
  apiKey: {
    token: '',
  },
  oAuth2: {
    username: '',
    password: '',
    clientId: '',
    scopes: [],
    accessToken: '',
    state: '',
  },
})

/** A little hack to use reactive client as the old authentication state */
const authenticationState = computed(() => {
  const baseAuth = createEmptyAuthenticationState()

  if (client.value?.store.activeCollection) {
    const { selectedSecuritySchemeUids } = client.value.store.activeCollection
    const schemes = selectedSecuritySchemeUids
      .map((uid) => client.value?.store.securitySchemes[uid])
      .filter(Boolean)

    console.log(schemes)
    // return auth
  } else {
    Object.assign(baseAuth, getAuthentication?.())
  }

  console.log('==========')
  console.log(baseAuth)
  console.log('==========')
  return baseAuth
})

async function generateSnippet() {
  // Use the selected custom example
  if (localHttpClient.value.targetKey === 'customExamples') {
    return (
      customRequestExamples.value[localHttpClient.value.clientKey]?.source ?? ''
    )
  }

  // Generate a request object
  const harRequest = getHarRequest(
    {
      url: getUrlFromServerState(serverState).modifiedUrl,
    },
    getRequestFromOperation(
      props.operation,
      {
        replaceVariables: true,
      },
      selectedExampleKey.value,
      true,
    ),
    getRequestFromAuthentication(
      authenticationState.value,
      props.operation.information?.security ?? getGlobalSecurity?.(),
    ),
  )

  const clientKey = httpClient.clientKey
  const targetKey = httpClient.targetKey

  return (
    (await getExampleCode(harRequest as any, targetKey, clientKey as string)) ??
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
