<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { snippetz } from '@scalar/snippetz'
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { HTTPSnippet } from 'httpsnippet-lite'
import { computed, ref, watch } from 'vue'

import {
  getApiClientRequest,
  getAvailableTargets,
  getHarRequest,
  getRequestFromAuthentication,
  getRequestFromOperation,
  getUrlFromServerState,
} from '../../../helpers'
import { useGlobalStore } from '../../../stores'
import { useTemplateStore } from '../../../stores/template'
import type { TransformedOperation } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'

const props = defineProps<{
  operation: TransformedOperation
}>()

const CodeMirrorValue = ref<string>('')
const { copyToClipboard } = useClipboard()
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
    // Snippetz
    console.log(
      state.selectedClient.targetKey,
      state.selectedClient.clientKey,
      snippetz().hasPlugin(
        // @ts-ignore
        state.selectedClient.targetKey,
        state.selectedClient.clientKey,
      ),
    )
    if (
      snippetz().hasPlugin(
        // @ts-ignore
        state.selectedClient.targetKey,
        state.selectedClient.clientKey,
      )
    ) {
      return (
        snippetz().print(
          // @ts-ignore
          state.selectedClient.targetKey,
          state.selectedClient.clientKey,
          request,
        ) ?? ''
      )
    }

    // httpsnippet-lite
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

computed(() => {
  return getApiClientRequest({
    serverState: serverState,
    authenticationState: authenticationState,
    operation: props.operation,
  })
})
</script>
<template>
  <Card class="dark-mode">
    <CardHeader muted>
      <div class="request-header">
        <span
          class="request-method"
          :class="`request-method--${operation.httpVerb}`">
          {{ operation.httpVerb }}
        </span>
        <slot name="header" />
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
              v-for="target in getAvailableTargets()"
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
      <!-- @vue-ignore -->
      <CodeMirror
        :content="CodeMirrorValue"
        :forceDarkMode="true"
        :languages="CodeMirrorLanguages"
        lineNumbers
        readOnly />
    </CardContent>
    <CardFooter
      v-if="$slots.footer"
      class="scalar-card-footer"
      contrast>
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
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  text-transform: uppercase;
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
  -moz-appearance: none;
  -webkit-appearance: none;
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

.scalar-card-header-actions {
  display: flex;
}
.scalar-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px;
}
.request-editor-section {
  display: grid;
  flex: 1;
}
</style>
