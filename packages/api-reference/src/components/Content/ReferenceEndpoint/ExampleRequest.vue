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
  type TargetId,
  availableTargets,
} from 'httpsnippet-lite'
import { computed, onMounted, ref, watch } from 'vue'

import {
  generateAxiosCodeFromRequest,
  generateLaravelCodeFromRequest,
} from '../../../helpers'
import { useTemplateStore } from '../../../stores/template'
import type { Operation, Server } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{ operation: Operation; server: Server }>()

const CodeMirrorValue = ref<string>('')

const { copyToClipboard } = useClipboard()

const { setActiveRequest } = useApiClientRequestStore()

const { toggleApiClient } = useApiClientStore()

const {
  state: templateState,
  getLanguageTitleByKey,
  setItem,
} = useTemplateStore()

const CodeMirrorLanguages = computed(() => {
  return [templateState.preferredLanguage]
})

const { parameterMap } = useOperation(props)

async function generateSnippet() {
  let path = props.operation.path

  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  const pathVariables = path.match(/{(.*?)}/g)

  if (pathVariables) {
    pathVariables.forEach((variable) => {
      const variableName = variable.replace(/{|}/g, '')
      path = path.replace(variable, `__${variableName.toUpperCase()}__`)
    })
  }

  let url = props.server.url

  // Replace all variables of the format {something} with the uppercase variable name without the brackets
  const urlVariables = url.match(/{{(.*?)}}/g)

  if (urlVariables) {
    console.log(urlVariables)
    urlVariables.forEach((variable) => {
      const variableName = variable.replace(/{|}/g, '')
      url = url.replace(variable, `__${variableName}__`)
    })
  }

  if (templateState.preferredLanguage === 'axios') {
    return generateAxiosCodeFromRequest({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${url}${path}`,
    })
  } else if (templateState.preferredLanguage === 'laravel') {
    return generateLaravelCodeFromRequest({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${url}${path}`,
    })
  }

  try {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${url}${path}`,
    } as HarRequest)
    const output = (await snippet.convert(
      templateState.preferredLanguage as TargetId,
    )) as string
    return output
  } catch {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${window.location.origin}${path}`,
    } as HarRequest)
    const output = (await snippet.convert(
      templateState.preferredLanguage as TargetId,
    )) as string

    return output
  }
}

onMounted(async () => {
  const initialSnippet = await generateSnippet()
  CodeMirrorValue.value = initialSnippet
  watch(
    () => templateState.preferredLanguage,
    async () => {
      const output = await generateSnippet()
      CodeMirrorValue.value = output
    },
  )
})

const copyExampleRequest = async () => {
  copyToClipboard(CodeMirrorValue.value)
}

function showItemInClient() {
  const item = generateRequest(
    props.operation,
    parameterMap.value,
    props.server,
  )
  setActiveRequest(item)
  toggleApiClient()
}

// Store selected languages in LocalStorage
const localStorageKey = 'preferredLanguage'
const selectLanguage = (language: TargetId) => {
  setItem('preferredLanguage', language)
  localStorage.setItem(localStorageKey, language)
}

const availableLanguages = computed(() => {
  return [
    ...availableTargets().filter((target) => target.key !== 'http'),
    { key: 'axios', title: 'JavaScript (Axios)' },
    { key: 'laravel', title: 'PHP (Laravel)' },
  ].sort((a, b) => a.title.localeCompare(b.title))
})
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
          <span>{{
            getLanguageTitleByKey(templateState.preferredLanguage)
          }}</span>
          <select
            class="language-select"
            :value="templateState.preferredLanguage"
            @input="event => selectLanguage((event.target as HTMLSelectElement).value as TargetId)">
            <option
              v-for="lang in availableLanguages"
              :key="lang.key"
              :value="lang.key">
              {{ lang.title }}
            </option>
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
    <CardFooter muted>
      <button
        class="show-api-client-button"
        type="button"
        @click="showItemInClient">
        <Icon src="solid/mail-send-email-paper-airplane" />
        Test {{ operation.httpVerb }} Request in Client
      </button>
    </CardFooter>
  </Card>
</template>
<style scoped>
.request-method--post {
  color: var(--theme-post-color);
}
.request-method--patch {
  color: var(--theme-patch-color);
}
.request-method--get {
  color: var(--theme-get-color);
}
.request-method--delete {
  color: var(--theme-delete-color);
}
.request-method--put {
  color: var(--theme-put-color);
}
.request-path {
  margin-left: 6px;
  color: var(--theme-color-2);
  white-space: nowrap;
  overflow: hidden;
  cursor: default;
  text-overflow: ellipsis;
  text-transform: none !important;
}

.language-select {
  position: relative;
  padding-right: 9px;
  border-right: 1px solid var(--theme-border-color);
}
.language-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--theme-background-3);
  box-shadow: -2px 0 0 0 var(--theme-background-3);
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  appearance: none;
}
.language-select span {
  font-size: 12px;
  color: var(--theme-color-3);
  font-weight: var(--theme-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: var(--theme-background-2);
}

.copy-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--theme-color-3);
  margin-left: 6px;
  border: none;
  border-radius: 3px;
}

.copy-button:hover {
  color: var(--theme-color-1);
}

.copy-button svg {
  width: 13px;
  height: 13px;
}

.show-api-client-button {
  width: 100%;
  display: block;
  appearance: none;
  outline: none;
  border: none;
  border-radius: var(--theme-radius-lg);
  height: 35px;
  display: flex;
  justify-content: center;
  cursor: pointer;
  align-items: center;
  font-weight: var(--theme-bold);
  font-size: var(--theme-micro);
  text-transform: uppercase;
  border: 1px solid currentColor;
  background: var(--theme-button-1);
  color: var(--theme-button-1-color);
}
.show-api-client-button:hover {
  background: var(--theme-button-1-hover);
}
.show-api-client-button svg {
  height: 12px;
  width: auto;
  margin-right: 6px;
}

.request-method {
  font-family: var(--theme-font-code);
}
.request-path {
  font-family: var(--theme-font-code);
}
</style>
