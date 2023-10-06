<script setup lang="ts">
import {
  generateRequest,
  useApiClientRequestStore,
  useApiClientStore,
  useOperation,
} from '@scalar/api-client'
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import {
  HTTPSnippet,
  type HarRequest,
  availableTargets,
} from 'httpsnippet-lite'
import { computed, ref, watch } from 'vue'

import { useTemplateStore } from '../../../stores/template'
import type { Operation, Server } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{ operation: Operation; server: Server }>()
const CodeMirrorValue = ref<string>('')
const { copyToClipboard } = useClipboard()
const { setActiveRequest } = useApiClientRequestStore()
const { toggleApiClient } = useApiClientStore()
const { state, setItem, getClientTitle, getTargetTitle } = useTemplateStore()

const CodeMirrorLanguages = computed(() => {
  return [state.selectedClient.targetKey]
})

const { parameterMap } = useOperation(props)

const generateSnippet = async () => {
  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let path = props.operation.path

  const pathVariables = path.match(/{(.*?)}/g)

  if (pathVariables) {
    pathVariables.forEach((variable) => {
      const variableName = variable.replace(/{|}/g, '')
      path = path.replace(variable, `__${variableName.toUpperCase()}__`)
    })
  }

  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  let url = props.server.url

  const urlVariables = url.match(/{{(.*?)}}/g)
  if (urlVariables) {
    urlVariables.forEach((variable) => {
      const variableName = variable.replace(/{|}/g, '')
      url = url.replace(variable, `__${variableName}__`)
    })
  }

  // Actually generate the snippet
  try {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${url}${path}`,
    } as HarRequest)

    return (await snippet.convert(
      state.selectedClient.targetKey,
      state.selectedClient.clientKey,
    )) as string
  } catch {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${window.location.origin}${path}`,
    } as HarRequest)

    return (await snippet.convert(
      state.selectedClient.targetKey,
      state.selectedClient.clientKey,
    )) as string
  }
}

// Update snippet when a different client is selected
watch(
  () => state.selectedClient,
  async () => {
    CodeMirrorValue.value = await generateSnippet()
  },
  {
    immediate: true,
  },
)

// Copy snippet to clipboard
const copyExampleRequest = async () => {
  copyToClipboard(CodeMirrorValue.value)
}

// Open API Client
const showItemInClient = () => {
  const item = generateRequest(
    props.operation,
    parameterMap.value,
    props.server,
  )
  setActiveRequest(item)
  toggleApiClient()
}
</script>
<template>
  <Card class="dark-mode">
    <CardHeader muted>
      <span :class="`request-method request-method--${operation.httpVerb}`">
        {{ operation.httpVerb }}
      </span>
      <span class="request-path">{{ operation.path }}</span>

      <template #actions>
        <div class="language-select">
          <span>
            {{ getTargetTitle(state.selectedClient) }}
            {{ getClientTitle(state.selectedClient) }}
          </span>
          <select
            :value="JSON.stringify(state.selectedClient)"
            @input="event => setItem('selectedClient', JSON.parse((event.target as HTMLSelectElement).value))">
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
          @click="copyExampleRequest">
          <Icon
            src="solid/interface-copy-clipboard"
            width="10px" />
        </button>
      </template>
    </CardHeader>
    <CardContent
      borderless
      frameless>
      <!-- @vue-ignore -->
      <CodeMirror
        :content="CodeMirrorValue"
        :forceDarkMode="true"
        :languages="CodeMirrorLanguages"
        lineNumbers
        readOnly />
    </CardContent>
    <CardFooter contrast>
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
<style scoped>
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
  text-transform: none !important;
  flex: 1;
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
  border: none;
  border-radius: 3px;
  padding: 0;
  display: flex;
  align-items: center;
  height: fit-content;
}
/* ghost character to make height match sibling height since we can't wrap them both in flex*/
.copy-button:after {
  content: '*';
  width: 0px;
  overflow: hidden;
  color: transparent;
  font-size: (--theme-mini, var(--default-theme-mini));
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
</style>
