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
import { EditorView } from 'codemirror'
import {
  HTTPSnippet,
  type HarRequest,
  type TargetId,
  availableTargets,
} from 'httpsnippet-lite'
import { computed, onMounted, watch } from 'vue'

import { useClipboard } from '@lib/hooks/useClipboard'
import { useCodeMirror } from '@lib/hooks/useCodeMirror'
import ProjectIcon from '@lib/icon-library/ProjectIcon.vue'

import { useTemplateStore } from '../../../stores/template'
import { ApiReferenceClasses } from '../../../styles'
import type { Operation, Server } from '../../../types'

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
  Exclude<TargetId, 'php'>,
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
</script>
<template>
  <div
    class="coder"
    :class="ApiReferenceClasses.CodeMenu">
    <div class="codemenu-topbar">
      <div class="codemenu">
        <a class="endpoint">
          <span :class="[operation.httpVerb]">{{ operation.httpVerb }}</span>
          <span class="codemenu-item-url">{{ operation.path }}</span>
        </a>
        <div class="coder-right">
          <div
            class="trigger-client"
            :class="[operation.httpVerb]">
            <div class="trigger-client-button">
              <svg
                height="22"
                viewBox="0 0 19 22"
                width="19"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.4 21.3c-1.9 1.2-3.4.3-3.4-1.9v-17C0 .2 1.5-.6 3.4.5l13.2 8.3c1.9 1.2 1.9 3 0 4.2L3.4 21.3Z"
                  fill="currentColor"
                  fill-rule="nonzero" />
              </svg>
              <button
                class="code-runit"
                type="button"
                @click="showItemInClient">
                Test
              </button>
            </div>
          </div>
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
                v-for="lang in availableTargets().filter(
                  (target) => target.key !== 'http',
                )"
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
            <ProjectIcon
              src="solid/interface-copy-clipboard"
              width="10px" />
          </button>
        </div>
      </div>
    </div>
    <div ref="codeMirrorRef" />
  </div>
</template>
<style scoped>
.coder {
  border-radius: var(--theme-radius);
  overflow: hidden;
}
.coder:hover .trigger-client {
  width: 62px;
  transition: none;
}
.coder:hover .trigger-client-button {
  transform: translate3d(-37px, 0, 0);
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
.trigger-client {
  display: flex;
  position: relative;
  cursor: pointer;
  user-select: none;
  transform: translate3d(0, 0, 0);
  margin-right: 8px;
  width: 25px;
  height: 25px;
  border-radius: 3px;
  overflow: hidden;
  transition: width 0.01s ease-in-out 0.3s;
}
.trigger-client-button {
  position: absolute;
  right: -37px;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-in-out;
  border-radius: 3px;
}
.trigger-client svg {
  color: white;
  position: absolute;
  left: 0;
  z-index: 2;
  width: 25px;
  height: 25px;
  padding: 6px;
  border-radius: 3px;
  pointer-events: none;
}
.trigger-client.post svg {
  color: var(--theme-post-color);
}
.trigger-client.post .trigger-client-button {
  background: var(--theme-post-background);
  color: var(--theme-post-color);
}
.trigger-client.patch svg {
  color: var(--theme-patch-color);
}
.trigger-client.patch .trigger-client-button {
  background: var(--theme-patch-background);
  color: var(--theme-patch-color);
}
.trigger-client.get svg {
  color: var(--theme-get-color);
}
.trigger-client.get .trigger-client-button {
  background: var(--theme-get-background);
  color: var(--theme-get-color);
}
.trigger-client.delete svg {
  color: var(--theme-delete-color);
}
.trigger-client.delete .trigger-client-button {
  background: var(--theme-delete-background);
  color: var(--theme-delete-color);
}
.trigger-client.put svg {
  color: var(--theme-put-color);
}
.trigger-client.put .trigger-client-button {
  background: var(--theme-put-background);
  color: var(--theme-put-color);
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
  height: 25px;
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
</style>
