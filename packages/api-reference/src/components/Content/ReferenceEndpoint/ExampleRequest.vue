<script setup lang="ts">
import { useApiClientStore, useRequestStore } from '@scalar/api-client'
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { HTTPSnippet, availableTargets } from 'httpsnippet-lite'
import { computed, ref, watch } from 'vue'

import {
  getApiClientRequest,
  getHarRequest,
  getRequestFromAuthentication,
  getRequestFromOperation,
  getUrlFromServerState,
} from '../../../helpers'
import { useGlobalStore } from '../../../stores'
import { useTemplateStore } from '../../../stores/template'
import type { TransformedOperation } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{
  operation: TransformedOperation
}>()

const CodeMirrorValue = ref<string>('')
const { copyToClipboard } = useClipboard()
const { setActiveRequest } = useRequestStore()
const { toggleApiClient } = useApiClientStore()
const { state, setItem, getClientTitle, getTargetTitle } = useTemplateStore()

const { server: serverState, authentication: authenticationState } =
  useGlobalStore()

const CodeMirrorLanguages = computed(() => {
  return [state.selectedClient.targetKey]
})

const generateSnippet = async (): Promise<string> => {
  // Generate a request object
  const request = getHarRequest(
    {
      url: getUrlFromServerState(serverState) ?? window.location.origin,
    },
    getRequestFromOperation(props.operation, {
      replaceVariables: true,
    }),
    getRequestFromAuthentication(authenticationState),
  )

  // Actually generate the snippet
  try {
    const snippet = new HTTPSnippet(request)

    return (await snippet.convert(
      state.selectedClient.targetKey,
      state.selectedClient.clientKey,
    )) as string
  } catch (e) {
    console.error('[ExampleRequest]', e)
    return ''
  }
}

watch(
  [
    // Update snippet when a different client is selected
    () => state.selectedClient,
    // … or the global server state changed
    () => serverState,
    // … or the global authentication state changed
    () => authenticationState,
  ],
  async () => {
    CodeMirrorValue.value = await generateSnippet()
  },
  {
    deep: true,
    immediate: true,
  },
)

// Open API Client
const showItemInClient = () => {
  const apiClientRequest = getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: props.operation,
  })
  setActiveRequest(apiClientRequest)
  toggleApiClient()
}

computed(() => {
  return getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: props.operation,
  })
})

const formattedPath = computed(() => {
  return (
    props.operation.path
      // Remove HTML tags
      .replace(/(<([^>]+)>)/gi, '')
      // Wrap a span around all variables
      .replace(/{([^}]+)}/g, '<span class="request-path-variable">{$1}</span>')
  )
})
</script>
<template>
  <Card
    v-if="CodeMirrorValue"
    class="dark-mode">
    <CardHeader muted>
      <div class="request">
        <span :class="`request-method request-method--${operation.httpVerb}`">
          {{ operation.httpVerb }}
        </span>
        <span
          class="request-path"
          v-html="formattedPath" />
      </div>
      <template #actions>
        <div class="language-select">
          <span>
            {{ getTargetTitle(state.selectedClient) }}
            {{ getClientTitle(state.selectedClient) }}
          </span>
          <select
            :value="JSON.stringify(state.selectedClient)"
            @input="
              (event) =>
                setItem(
                  'selectedClient',
                  JSON.parse((event.target as HTMLSelectElement).value),
                )
            ">
            <optgroup
              v-for="target in availableTargets()"
              :key="target.key"
              :label="target.title">
              <option
                v-for="client in target.clients"
                :key="client.key"
                :value="
                  JSON.stringify({
                    targetKey: target.key,
                    clientKey: client.key,
                  })
                ">
                {{ client.title }}
              </option>
            </optgroup>
          </select>
        </div>

        <button
          class="copy-button"
          type="button"
          @click="copyToClipboard(CodeMirrorValue)">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="custom-scroll"
      frameless>
      <!-- @vue-ignore -->
      <CodeMirror
        :content="CodeMirrorValue"
        :forceDarkMode="true"
        :languages="CodeMirrorLanguages"
        lineNumbers
        readOnly />
    </CardContent>
    <CardFooter
      class="scalar-card-footer"
      contrast>
      <button
        class="show-api-client-button"
        :class="`show-api-client-button--${operation.httpVerb}`"
        type="button"
        @click="showItemInClient">
        <span>Test Request</span>
        <Icon src="solid/mail-send-email-paper-airplane" />
      </button>
    </CardFooter>
  </Card>
</template>
<style>
.request-path-variable {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>
<style scoped>
.request {
  display: flex;
  flex-wrap: nowrap;
}
.request-method {
  white-space: nowrap;
}
.request-method--post {
  color: var(--theme-color-green, var(--default-theme-color-green));
}
.request-method--patch {
  color: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.request-method--get {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}
.request-method--delete {
  color: var(--theme-color-red, var(--default-theme-color-red));
}
.request-method--put {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}
.request-path {
  margin-left: 6px;
  color: var(--theme-color-2, var(--default-theme-color-2));
  overflow: hidden;
  cursor: default;
  word-wrap: break-word;
  text-transform: none !important;
}

.language-select {
  position: relative;
  padding-right: 9px;
  height: fit-content;
  padding-left: 12px;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.language-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--theme-background-3, var(--default-theme-background-3));
  box-shadow: -2px 0 0 0
    var(--theme-background-3, var(--default-theme-background-3));
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  appearance: none;
}
.language-select span {
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.language-select:hover span {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.language-select span:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}
.language-select span:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}

.copy-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--theme-color-3, var(--default-theme-color-3));
  margin-left: 6px;
  margin-right: 12px;
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
  font-size: var(--theme-mini, var(--default-theme-mini));
  line-height: 1.35;
  width: 0px;
}
.copy-button:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.copy-button svg {
  width: 13px;
  height: 13px;
}

.show-api-client-button {
  display: block;
  appearance: none;
  outline: none;
  border: none;
  padding: 6px;
  margin-left: auto;
  height: 23px;
  margin: 6px 6px 6px auto;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  cursor: pointer;
  align-items: center;
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-background-2, var(--default-background-2));
  font-family: var(--theme-font, var(--default-theme-font));
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}
.show-api-client-button span,
.show-api-client-button svg {
  color: var(--theme-color-1, var(--default-theme-color-1));
  z-index: 1;
}
.show-api-client-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  cursor: pointer;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.show-api-client-button:before {
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
}
.show-api-client-button:hover:before {
  background: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
}
.show-api-client-button svg {
  height: 12px;
  width: auto;
  margin-left: 9px;
}
.show-api-client-button--post {
  background: var(--theme-color-green, var(--default-theme-color-green));
}
.show-api-client-button--patch {
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.show-api-client-button--get {
  background: var(--theme-color-blue, var(--default-theme-color-blue));
}
.show-api-client-button--delete {
  background: var(--theme-color-red, var(--default-theme-color-red));
}
.show-api-client-button--put {
  background: var(--theme-color-orange, var(--default-theme-color-orange));
}
.request-method {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  text-transform: uppercase;
}
.request-path {
  font-family: var(--theme-font-code, var(--default-theme-font-code));
}
.scalar-card-header-actions {
  display: flex;
}
@media screen and (max-width: 400px) {
  .language-select {
    position: absolute;
    bottom: 9px;
    left: 0;
    border-right: none;
  }
}
</style>
