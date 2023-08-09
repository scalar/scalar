<script setup lang="ts">
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { type LanguageSupport } from '@codemirror/language'
import { StreamLanguage } from '@codemirror/language'
import {
  c,
  csharp,
  kotlin,
  objectiveC,
} from '@codemirror/legacy-modes/mode/clike'
import { clojure } from '@codemirror/legacy-modes/mode/clojure'
import { go } from '@codemirror/legacy-modes/mode/go'
import { http } from '@codemirror/legacy-modes/mode/http'
import { oCaml } from '@codemirror/legacy-modes/mode/mllike'
import { powerShell } from '@codemirror/legacy-modes/mode/powershell'
import { r } from '@codemirror/legacy-modes/mode/r'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { lineNumbers } from '@codemirror/view'
import {
  generateRequest,
  useApiClientRequestStore,
  useApiClientStore,
} from '@scalar/api-client'
import { useOperation } from '@scalar/api-client'
import { useClipboard } from '@scalar/use-clipboard'
import { useCodeMirror } from '@scalar/use-codemirror'
import { EditorView } from 'codemirror'
import {
  HTTPSnippet,
  type HarRequest,
  type TargetId,
  availableTargets,
} from 'httpsnippet-lite'
import { computed, onMounted, watch } from 'vue'

import {
  generateAxiosCodeFromRequest,
  generateLaravelCodeFromRequest,
} from '../../../helpers'
import { useTemplateStore } from '../../../stores/template'
import type { Operation, Server } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import { Icon } from '../../Icon'

const props = defineProps<{ operation: Operation; server: Server }>()

const { copyToClipboard } = useClipboard()

const { setActiveRequest } = useApiClientRequestStore()

const { toggleApiClient } = useApiClientStore()

const {
  state: templateState,
  getLanguageTitleByKey,
  setItem,
} = useTemplateStore()

// TODO: Add PHP
const syntaxHighlighting: Record<
  Exclude<TargetId, 'php'> | 'axios',
  LanguageSupport | StreamLanguage<any>
> = {
  c: StreamLanguage.define(c),
  clojure: StreamLanguage.define(clojure),
  csharp: StreamLanguage.define(csharp),
  go: StreamLanguage.define(go),
  http: StreamLanguage.define(http),
  java: java(),
  javascript: javascript(),
  kotlin: StreamLanguage.define(kotlin),
  node: javascript(),
  objc: StreamLanguage.define(objectiveC),
  ocaml: StreamLanguage.define(oCaml),
  powershell: StreamLanguage.define(powerShell),
  python: python(),
  r: StreamLanguage.define(r),
  ruby: StreamLanguage.define(ruby),
  shell: StreamLanguage.define(shell),
  swift: StreamLanguage.define(swift),
  axios: javascript(),
}

const editorExtensions = computed(() => {
  const extensions = [lineNumbers(), EditorView.editable.of(false)]

  if (
    Object.hasOwnProperty.call(
      syntaxHighlighting,
      templateState.preferredLanguage,
    )
  ) {
    // @ts-ignore
    extensions.push(syntaxHighlighting[templateState.preferredLanguage])
  }

  return extensions
})

const { codeMirrorRef, setCodeMirrorContent, reconfigureCodeMirror } =
  useCodeMirror({
    content: '',
    extensions: editorExtensions.value,
    forceDarkMode: true,
  })

const { parameterMap } = useOperation(props)

async function generateSnippet() {
  if (templateState.preferredLanguage === 'axios') {
    return generateAxiosCodeFromRequest({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${props.server.url}${props.operation.path}`,
    })
  } else if (templateState.preferredLanguage === 'laravel') {
    return generateLaravelCodeFromRequest({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${props.server.url}${props.operation.path}`,
    })
  }

  try {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${props.server.url}${props.operation.path}`,
    } as HarRequest)
    const output = (await snippet.convert(
      templateState.preferredLanguage as TargetId,
    )) as string
    return output
  } catch {
    const snippet = new HTTPSnippet({
      method: props.operation.httpVerb.toUpperCase(),
      url: `${window.location.origin}${props.operation.path}`,
    } as HarRequest)
    const output = (await snippet.convert(
      templateState.preferredLanguage as TargetId,
    )) as string

    return output
  }
}

onMounted(async () => {
  const initialSnippet = await generateSnippet()
  setCodeMirrorContent(initialSnippet)
  watch(
    () => templateState.preferredLanguage,
    async () => {
      const output = await generateSnippet()
      setCodeMirrorContent(output)
      reconfigureCodeMirror(editorExtensions.value)
    },
  )
})

const copyExampleRequest = async () => {
  copyToClipboard(await generateSnippet())
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
  <div class="dark-mode">
    <Card>
      <CardHeader muted>
        <span :class="`http-method http-method--${operation.httpVerb}`">
          {{ operation.httpVerb }}
        </span>
        <span class="codemenu-item-url">{{ operation.path }}</span>

        <template #actions>
          <div class="scalar-api-reference-language-select">
            <span>{{
              getLanguageTitleByKey(templateState.preferredLanguage)
            }}</span>
            <select
              class="scalar-api-reference-language-select"
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
            class="code-copy"
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
        <div ref="codeMirrorRef" />
      </CardContent>
      <CardFooter muted>
        <button
          class="trigger-scalar-client-button"
          type="button"
          @click="showItemInClient">
          <Icon src="solid/mail-send-email-paper-airplane" />
          Test {{ operation.httpVerb }} Request in Client
        </button>
      </CardFooter>
    </Card>
  </div>
</template>
<style scoped>
.trigger-scalar-client-button {
  width: 100%;
  display: block;
  appearance: none;
  outline: none;
  border: none;
  border-radius: var(--scalar-api-reference-theme-radius-lg);
  height: 35px;
  display: flex;
  justify-content: center;
  cursor: pointer;
  align-items: center;
  font-weight: var(--scalar-api-reference-theme-bold);
  font-size: var(--scalar-api-reference-theme-micro);
  text-transform: uppercase;
  border: 1px solid currentColor;
  background: var(--scalar-api-reference-theme-button-1);
  color: var(--scalar-api-reference-theme-button-1-color);
}
.trigger-scalar-client-button:hover {
  background: var(--scalar-api-reference-theme-button-1-hover);
}
.trigger-scalar-client-button svg {
  height: 12px;
  width: auto;
  margin-right: 6px;
}
.coder {
  border-radius: var(--scalar-api-reference-theme-radius-lg);
  border: 1px solid var(--scalar-api-reference-theme-border-color);
  overflow: hidden;
}
.code-copy {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--scalar-api-reference-theme-color-3);
  margin-left: 6px;
  border: none;
  border-radius: 3px;
  &:hover {
    color: var(--scalar-api-reference-theme-color-1);
  }
  svg {
    width: 13px;
    height: 13px;
  }
}
.code-runit {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  outline: none;
  border: none;
  display: flex;
  cursor: pointer;
  font-size: 11px;
  font-weight: var(--scalar-api-reference-theme-bold);
  text-transform: uppercase;
  color: currentColor;
  padding: 6px 9px 6px 24px;
}
.scalar-api-reference-language-select {
  position: relative;
  padding-right: 9px;
  border-right: 1px solid var(--scalar-api-reference-theme-border-color);
}
.scalar-api-reference-language-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--scalar-api-reference-theme-background-3);
  box-shadow: -2px 0 0 0 var(--scalar-api-reference-theme-background-3);
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  appearance: none;
}
.scalar-api-reference-language-select span {
  font-size: 12px;
  color: var(--scalar-api-reference-theme-color-3);
  font-weight: var(--scalar-api-reference-theme-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.scalar-api-reference-language-select span:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}
.scalar-api-reference-language-select span:hover {
  background: var(--scalar-api-reference-theme-background-2);
}
.coder-right {
  display: flex;
  align-items: center;
  min-height: 21px;
}
.trigger-scalar-client {
  background: var(--scalar-api-reference-theme-background-2);
  padding: 4px 12px 12px 12px;
}
.http-method--post {
  color: var(--scalar-api-reference-theme-post-color);
}
.http-method--patch {
  color: var(--scalar-api-reference-theme-patch-color);
}
.http-method--get {
  color: var(--scalar-api-reference-theme-get-color);
}
.http-method--delete {
  color: var(--scalar-api-reference-theme-delete-color);
}
.http-method--put {
  color: var(--scalar-api-reference-theme-put-color);
}

.dark-mode-document-remove-everything {
  all: unset;
}
</style>
