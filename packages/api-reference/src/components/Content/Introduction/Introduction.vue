<script setup lang="ts">
import { type TargetId } from 'httpsnippet-lite'
import { computed } from 'vue'

import { useTemplateStore } from '../../../stores/template'
import type { Info, Server } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import BaseUrl from './BaseUrl.vue'
import LanguageSelector from './LanguageSelector.vue'

defineProps<{
  info: Info
  servers: Server[]
}>()

const { state, getLanguageTitleByKey } = useTemplateStore()

// TODO: Doesn’t work … why?
// type TargetIdWithoutHttp = Exclude<TargetId, 'http'>
type TargetIdWithoutHttp = TargetId

const standardLibrary = computed(() => {
  const standardLibraries: Record<
    TargetIdWithoutHttp | 'axios' | 'laravel',
    string
  > = {
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
    laravel: '',
    axios: '',
  }

  return standardLibraries[state.preferredLanguage] ?? ''
})
</script>

<template>
  <div class="reference">
    <div class="reference-container">
      <div class="copy">
        <div class="editor-heading">
          <h1
            class="heading"
            :class="{ loading: !info.title }">
            {{ info.title || '&nbsp;' }}
          </h1>
        </div>
        <p class="tag-description">
          <template v-if="info.description">
            <MarkdownRenderer :value="info.description" />
          </template>
          <!-- @vue-ignore -->
          <template
            v-for="index in [...Array(8).keys()]"
            v-else
            :key="index">
            <span class="loading" />
          </template>
        </p>
      </div>
      <div class="example flex-col gap-1">
        <Card v-if="servers.length > 0">
          <CardHeader muted>
            Base URL{{ servers?.length > 1 ? 's' : '' }}
          </CardHeader>
          <CardContent
            v-for="server in servers"
            :key="server.url"
            muted>
            <BaseUrl :server="server" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Client Libraries</CardHeader>
          <CardContent frameless>
            <LanguageSelector />
          </CardContent>
          <CardFooter
            class="font-mono"
            muted
            style="
              font-size: var(--scalar-api-reference-theme-mini);
              color: var(--scalar-api-reference-theme-color-2);
            ">
            {{ getLanguageTitleByKey(state.preferredLanguage) }}
            {{ standardLibrary }}
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
<style scoped>
.heading {
  margin-top: 0px !important;
}
.loading {
  background: var(--scalar-api-reference-theme-background-2);
  animation: loading-skeleton 2s infinite alternate;
  border-radius: var(--scalar-api-reference-rounded);
}
.heading.loading {
  width: 80%;
}
.tag-description .loading {
  height: 20px;
  margin-bottom: 4px;
  width: 100%;
  display: inline-block;
}
.tag-description .loading:first-of-type {
  margin-top: 12px;
}
.tag-description .loading:last-of-type {
  width: 40%;
}
@keyframes loading-skeleton {
  from {
    background: var(--scalar-api-reference-theme-background-2);
  }
  to {
    background: var(--scalar-api-reference-theme-background-3);
  }
}
</style>
