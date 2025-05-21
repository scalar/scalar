<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type {
  Collection,
  Operation,
  ResponseInstance,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { computed, ref, useId } from 'vue'

import SectionFilter from '@/components/SectionFilter.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { SendRequestResult } from '@/libs/send-request/create-request-operation'
import { usePluginManager } from '@/plugins'

import RequestHeaders from './RequestHeaders.vue'
import ResponseBody from './ResponseBody.vue'
import ResponseBodyStreaming from './ResponseBodyStreaming.vue'
import ResponseBodyVirtual from './ResponseBodyVirtual.vue'
import ResponseCookies from './ResponseCookies.vue'
import ResponseEmpty from './ResponseEmpty.vue'
import ResponseHeaders from './ResponseHeaders.vue'
import ResponseLoadingOverlay from './ResponseLoadingOverlay.vue'
import ResponseMetaInformation from './ResponseMetaInformation.vue'

const { numWorkspaceRequests, response, requestResult } = defineProps<{
  collection: Collection
  operation: Operation
  workspace: Workspace
  numWorkspaceRequests: number
  response: ResponseInstance | undefined
  requestResult: SendRequestResult | null | undefined
}>()

const pluginManager = usePluginManager()
const responseSectionViews = pluginManager.getViewComponents('response.section')

// Headers
const responseHeaders = computed(() => {
  const headers = response?.headers

  return headers
    ? Object.keys(headers).map((key) => ({
        name: key,
        value: headers[key] ?? '',
        required: false,
      }))
    : []
})

// Cookies
const responseCookies = computed(
  () =>
    response?.cookieHeaderKeys.flatMap((key) => {
      const value = response?.headers?.[key]

      return value
        ? {
            name: key,
            value,
            required: false,
          }
        : []
    }) ?? [],
)

const responseSections = ['Cookies', 'Headers', 'Body'] as const
type Filter = 'All' | (typeof responseSections)[number]
const activeFilter = ref<Filter>('All')

const filters = computed<Filter[]>(() => ['All', ...responseSections])

const filterIds = computed(
  () =>
    Object.fromEntries(
      filters.value.map((section) => [section, useId()]),
    ) as Record<Filter, string>,
)

/** Threshold for virtualizing response bodies in bytes */
const VIRTUALIZATION_THRESHOLD = 200_000
const shouldVirtualize = computed(() => {
  if (!response || !('size' in response)) {
    return false
  }

  // Get content type from headers
  const contentType =
    response.headers?.['content-type'] || response.headers?.['Content-Type']

  // If no content type or response size is small, don't virtualize
  if (!contentType || (response.size ?? 0) <= VIRTUALIZATION_THRESHOLD) {
    return false
  }

  // Do not virtualize html
  if (contentType.includes('text/html')) {
    return false
  }

  // Common text-based content types
  const textBasedTypes = [
    // Text types
    'text/',
    // JSON types
    'application/json',
    'application/ld+json',
    'application/problem+json',
    'application/vnd.api+json',
    // XML types
    'application/xml',
    'application/atom+xml',
    'application/rss+xml',
    'application/problem+xml',
    // Other structured text
    'application/javascript',
    'application/ecmascript',
    'application/x-yaml',
    'application/yaml',
    // Source code
    'application/x-httpd-php',
    'application/x-sh',
    'application/x-perl',
    'application/x-python',
    'application/x-ruby',
    'application/x-java-source',
    // Form data
    'application/x-www-form-urlencoded',
  ]

  // Check if content type matches any text-based type
  const isTextBased = textBasedTypes.some((type) => contentType.includes(type))

  return isTextBased && (response.size ?? 0) > VIRTUALIZATION_THRESHOLD
})

const requestHeaders = computed(
  () =>
    requestResult?.request.parameters.headers
      .filter((h) => h.enabled)
      .map((h) => ({
        name: h.key,
        value: h.value,
        required: true,
      })) ?? [],
)
</script>
<template>
  <ViewLayoutSection aria-label="Response">
    <template #title>
      <div class="flex h-8 flex-1 items-center">
        <div
          aria-live="polite"
          class="flex items-center"
          :class="{ 'animate-response-heading': response }">
          <span class="response-heading pointer-events-none absolute">
            Response
          </span>
          <ResponseMetaInformation
            v-if="response"
            class="animate-response-children"
            :response="response" />
        </div>
        <SectionFilter
          v-model="activeFilter"
          :filterIds="filterIds"
          :filters="filters" />
      </div>
    </template>
    <div
      :id="filterIds.All"
      class="custom-scroll response-section-content relative grid h-full justify-stretch"
      :class="{
        'content-start': response,
      }"
      :role="activeFilter === 'All' && response ? 'tabpanel' : 'none'">
      <template v-if="!response">
        <ResponseEmpty
          :collection="collection"
          :operation="operation"
          :workspace="workspace"
          :numWorkspaceRequests="numWorkspaceRequests" />
      </template>
      <template v-else>
        <ResponseCookies
          class="response-section-content-cookies"
          v-if="activeFilter === 'All' || activeFilter === 'Cookies'"
          :id="filterIds.Cookies"
          :cookies="responseCookies"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />
        <RequestHeaders
          class="response-section-content-headers"
          v-if="activeFilter === 'All' || activeFilter === 'Headers'"
          :id="filterIds.Headers"
          :headers="requestHeaders"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />
        <ResponseHeaders
          class="response-section-content-headers"
          v-if="activeFilter === 'All' || activeFilter === 'Headers'"
          :id="filterIds.Headers"
          :headers="responseHeaders"
          :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />

        <template
          v-for="view in responseSectionViews"
          :key="view.component">
          <ScalarErrorBoundary>
            <component
              :is="view.component"
              v-show="activeFilter === 'All' || activeFilter === view.title"
              v-bind="view.props ?? {}" />
          </ScalarErrorBoundary>
        </template>

        <template v-if="activeFilter === 'All' || activeFilter === 'Body'">
          <!-- Streaming response body -->
          <ResponseBodyStreaming
            v-if="'reader' in response"
            class="response-section-content-body"
            :id="filterIds.Body"
            :reader="response.reader" />

          <!-- Virtualized Text for massive responses -->
          <ResponseBodyVirtual
            v-else-if="shouldVirtualize && typeof response?.data === 'string'"
            :id="filterIds.Body"
            :content="response!.data"
            :data="response?.data"
            :headers="responseHeaders"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'" />

          <!-- Regular response body -->
          <ResponseBody
            class="response-section-content-body"
            v-else
            :id="filterIds.Body"
            layout="client"
            :active="true"
            :data="response?.data"
            :headers="responseHeaders"
            :role="activeFilter === 'All' ? 'none' : 'tabpanel'"
            title="Body" />
        </template>
      </template>
      <ResponseLoadingOverlay />
    </div>
  </ViewLayoutSection>
</template>
<style scoped>
.animate-response-heading .response-heading {
  animation: push-response 0.2s ease-in-out forwards;
  opacity: 1;
}
@keyframes push-response {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}
.animate-response-heading .animate-response-children {
  animation: response-spans 0.2s ease-in-out forwards 0.05s;
  opacity: 0;
}

@keyframes response-spans {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
