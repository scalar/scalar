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

import { generateAxiosCodeFromRequest } from '../../../helpers/generateAxiosCodeFromRequest'
import { useTemplateStore } from '../../../stores/template'
import type { Operation, Server } from '../../../types'
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
  // @ts-ignore
  if (templateState.preferredLanguage === 'axios') {
    return generateAxiosCodeFromRequest({
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
  ].sort((a, b) => a.title.localeCompare(b.title))
})
</script>
<template>
  <div class="dark-mode">
    <div class="dark-mode-document-remove-everything">
      <div class="coder">
        <div class="codemenu-topbar">
          <div class="codemenu">
            <a class="endpoint">
              <span
                class="codemenu-item-title"
                :class="operation.httpVerb">
                {{ operation.httpVerb }}
              </span>
              <span class="codemenu-item-url">{{ operation.path }}</span>
            </a>
            <div class="coder-right">
              <div class="codemirror-select">
                <span>{{
                  getLanguageTitleByKey(templateState.preferredLanguage)
                }}</span>
                <select
                  ref="select-option-code-block"
                  class="codemirror-select"
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
            </div>
          </div>
        </div>
        <div ref="codeMirrorRef" />
        <div class="trigger-scalar-client">
          <button
            class="trigger-scalar-client-button"
            type="button"
            @click="showItemInClient">
            <svg
              fill="none"
              height="48"
              viewBox="0 0 14 14"
              width="48"
              xmlns="http://www.w3.org/2000/svg">
              <g id="send-email--mail-send-email-paper-airplane">
                <path
                  id="Subtract"
                  clip-rule="evenodd"
                  d="M11.8215 0.0977331C12.1097 -0.0075178 12.422 -0.0287134 12.7219 0.0367172C13.0248 0.102803 13.3024 0.254481 13.5216 0.473719C13.7409 0.692957 13.8926 0.970537 13.9586 1.27346C14.0241 1.57338 14.0029 1.88566 13.8976 2.17389L10.3236 12.8859L10.3234 12.8866C10.2363 13.15 10.083 13.3867 9.87813 13.5739C9.67383 13.7606 9.42512 13.8917 9.15575 13.9549C8.88633 14.0206 8.60444 14.015 8.33777 13.9388C8.07134 13.8627 7.82929 13.7187 7.63532 13.5209L5.71798 11.6123L3.70392 12.6538C3.54687 12.735 3.3586 12.7272 3.20877 12.6333C3.05895 12.5395 2.96984 12.3734 2.97443 12.1967L3.057 9.01294L10.102 3.89553C10.3812 3.69267 10.4432 3.30182 10.2403 3.02255C10.0375 2.74327 9.64662 2.68133 9.36734 2.88419L2.20286 8.0884L0.473156 6.35869L0.473098 6.35864L0.472971 6.35851C0.285648 6.17132 0.147746 5.94054 0.0716498 5.68688C-0.00390565 5.43503 -0.016181 5.16847 0.0358684 4.91079C0.087985 4.62928 0.213827 4.36658 0.400607 4.14951C0.588668 3.93095 0.831681 3.76658 1.10453 3.67339L1.1079 3.67224L1.1079 3.67225L11.8215 0.0977331Z"
                  fill="currentColor"
                  fill-rule="evenodd"></path>
              </g>
            </svg>
            Test {{ operation.httpVerb }} Request in Client
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.trigger-scalar-client-button {
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
.trigger-scalar-client-button:hover {
  background: var(--theme-button-1-hover);
}
.trigger-scalar-client-button svg {
  height: 12px;
  width: auto;
  margin-right: 6px;
}
.coder {
  border-radius: var(--theme-radius-lg);
  border: 1px solid var(--theme-border-color);
  overflow: hidden;
}
.code-copy {
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
  padding: 5px;
  &:hover {
    color: var(--theme-color-1);
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
  font-weight: var(--theme-bold);
  text-transform: uppercase;
  color: currentColor;
  padding: 6px 9px 6px 24px;
}
.codemirror-select {
  position: relative;
  padding-right: 9px;
  border-right: 1px solid var(--theme-border-color);
  height: 21px;
}
.codemirror-select select {
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
.codemirror-select span {
  height: 100%;
  font-size: 12px;
  padding: 4px 0;
  color: var(--theme-color-3);
  font-weight: var(--theme-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.codemirror-select span:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}
.codemirror-select span:hover {
  background: var(--theme-background-2);
}
.coder-right {
  display: flex;
  align-items: center;
  min-height: 21px;
}
.trigger-scalar-client {
  background: var(--theme-background-2);
  padding: 4px 12px 12px 12px;
}
.codemenu-item-title {
  /* color: var(--theme-color-1) !important; */
}
.dark-mode-document-remove-everything {
  all: unset;
}
</style>
