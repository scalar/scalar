<script setup lang="ts">
import { type TargetId } from 'httpsnippet-lite'
import { computed } from 'vue'

import { EditorClasses } from '@guide/styles'

import { useTemplateStore } from '../../../stores/template'
import { ApiReferenceClasses } from '../../../styles'
import type { Info, Server } from '../../../types'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import BaseUrl from './BaseUrl.vue'
import LanguageSelector from './LanguageSelector.vue'

defineProps<{ info: Info; server: Server }>()

const { state, getLanguageTitleByKey } = useTemplateStore()

// TODO: Doesn’t work … why?
// type TargetIdWithoutHttp = Exclude<TargetId, 'http'>
type TargetIdWithoutHttp = TargetId

const standardLibrary = computed(() => {
  const standardLibraries: Record<TargetIdWithoutHttp, string> = {
    shell: 'Curl',
    ruby: 'Net::HTTP',
    node: 'HTTPS',
    php: 'cURL',
    python: 'http.client',
    c: 'libcurl',
    clojure: 'clj-http',
    csharp: 'RestClient',
    go: 'net/http',
    java: 'Unirest',
    javascript: 'XMLHttpRequest',
    kotlin: 'OkHttp',
    objc: 'NSURLSession',
    ocaml: 'Cohttp',
    powershell: 'Invoke-WebRequest',
    r: 'httr',
    swift: 'NSURLSession',
    // TODO: Remove, but fix `TargetIdWithoutHttp` first
    http: '',
  }

  return standardLibraries[state.preferredLanguage] ?? ''
})
</script>

<template>
  <div class="reference">
    <div class="reference-container">
      <div class="copy">
        <div :class="EditorClasses.Heading">
          <h1
            v-if="info.title"
            class="heading">
            {{ info.title }}
          </h1>
        </div>
        <p class="tag-description">
          <MarkdownRenderer :value="info.description" />
        </p>
      </div>
      <div
        class="example"
        :class="ApiReferenceClasses.LanguageSelector">
        <BaseUrl :url="server.url" />
        <div
          class="client-libraries"
          contenteditable="false"
          data-node-view-wrapper=""
          style="white-space: normal">
          <div
            class="client-libraries-header"
            style="width: 100%">
            <span>Client Libraries</span>
          </div>
          <div class="client-libraries-content">
            <LanguageSelector />
          </div>
          <div class="client-libraries-footer font-mono">
            {{ getLanguageTitleByKey(state.preferredLanguage) }}
            {{ standardLibrary }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.heading {
  margin-top: 0px !important;
}
</style>
