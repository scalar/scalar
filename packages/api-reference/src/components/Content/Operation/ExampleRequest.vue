<script setup lang="ts">
import {
  HttpMethod,
  getRequestFromAuthentication,
  getSecretCredentialsFromAuthentication,
  useAuthenticationStore,
} from '@scalar/api-client'
import { ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import {
  type ExampleRequestSSRKey,
  type SSRState,
  type TransformedOperation,
  createHash,
  getHarRequest,
  getRequestFromOperation,
  ssrState,
} from '@scalar/oas-utils'
import { snippetz } from '@scalar/snippetz'
import { HTTPSnippet } from 'httpsnippet-lite'
import {
  computed,
  inject,
  onServerPrefetch,
  ref,
  useSSRContext,
  watch,
} from 'vue'

import {
  GLOBAL_SECURITY_SYMBOL,
  getApiClientRequest,
  getUrlFromServerState,
  sleep,
} from '../../../helpers'
import { useClipboard, useHttpClients } from '../../../hooks'
import { useHttpClientStore, useServerStore } from '../../../stores'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import ExamplePicker from './ExamplePicker.vue'
import TextSelect from './TextSelect.vue'

const props = defineProps<{
  operation: TransformedOperation
}>()

const ssrHash = createHash(
  props.operation.path + props.operation.httpVerb + props.operation.operationId,
)
const ssrStateKey =
  `components-Content-Operation-Example-Request${ssrHash}` satisfies ExampleRequestSSRKey

const generatedCode = ref<string>(ssrState[ssrStateKey] ?? '')
const selectedExampleKey = ref<string>()

const { copyToClipboard } = useClipboard()
const { httpClient, setHttpClient, httpTargetTitle, httpClientTitle } =
  useHttpClientStore()

const { availableTargets } = useHttpClients()

const { server: serverState } = useServerStore()
const { authentication: authenticationState } = useAuthenticationStore()

const hasMultipleExamples = computed<boolean>(
  () =>
    props.operation.information?.requestBody?.content?.['application/json']
      ?.examples &&
    Object.keys(
      props.operation.information?.requestBody?.content?.['application/json']
        .examples,
    ).length > 1,
)

const getGlobalSecurity = inject(GLOBAL_SECURITY_SYMBOL)

const generateSnippet = async (): Promise<string> => {
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

  // Actually generate the snippet
  try {
    // Snippetz
    if (
      snippetz().hasPlugin(
        httpClient.targetKey.replace('javascript', 'js'),
        // @ts-ignore
        httpClient.clientKey,
      )
    ) {
      return (
        snippetz().print(
          // @ts-ignore
          httpClient.targetKey.replace('javascript', 'js'),
          httpClient.clientKey,
          request,
        ) ?? ''
      )
    }

    // httpsnippet-lite
    const snippet = new HTTPSnippet(request)
    return (await snippet.convert(
      httpClient.targetKey,
      httpClient.clientKey,
    )) as string
  } catch (e) {
    console.error('[ExampleRequest]', e)
    return ''
  }
}

watch(
  [
    // Update snippet when a different client is selected
    () => httpClient,
    // … or the global server state changed
    () => serverState,
    // … or the global authentication state changed
    () => authenticationState,
    // … or the selected example key
    () => selectedExampleKey,
  ],
  async () => {
    generatedCode.value = await generateSnippet()
  },
  {
    deep: true,
    immediate: true,
  },
)

onServerPrefetch(async () => {
  const ctx = useSSRContext<SSRState>()
  await sleep(1)
  ctx!.payload.data[ssrStateKey] = generatedCode.value
})

computed(() => {
  return getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: props.operation,
    globalSecurity: getGlobalSecurity?.(),
  })
})
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
          :modelValue="JSON.stringify(httpClient)"
          :options="
            availableTargets.map((target) => {
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
          "
          @update:modelValue="(value) => setHttpClient(JSON.parse(value))">
          {{ httpTargetTitle }}
          {{ httpClientTitle }}
        </TextSelect>

        <button
          class="copy-button"
          type="button"
          @click="copyToClipboard(generatedCode)">
          <ScalarIcon
            icon="Clipboard"
            width="10px" />
        </button>
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <!-- Multiple examples -->
      <div class="code-snippet">
        <ScalarCodeBlock
          :content="generatedCode"
          :hideCredentials="
            getSecretCredentialsFromAuthentication(authenticationState)
          "
          :lang="httpClient.targetKey"
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
  border-right: 1px solid var(--scalar-border-color);
}

.copy-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--scalar-color-3);
  margin-left: 6px;
  margin-right: 10.5px;
  border: none;
  border-radius: 3px;
  padding: 0;
  display: flex;
  align-items: center;
  height: fit-content;
}
/* Can't use flex align center on parent (scalar-card-header-actions) so have to match sibling font size vertically align*/
.copy-button:after {
  content: '.';
  color: transparent;
  font-size: var(--scalar-mini);
  line-height: 1.35;
  width: 0px;
}
.copy-button:hover {
  color: var(--scalar-color-1);
}

.copy-button svg {
  width: 13px;
  height: 13px;
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
