<script setup lang="ts">
import { isJsonString } from '@scalar/oas-utils'
import { computed, toRaw } from 'vue'

import Computer from '../../../assets/computer.ascii?raw'
import { useRequestStore } from '../../../stores'
import { CollapsibleSection } from '../../CollapsibleSection'
import { SimpleGrid } from '../../Grid'
import ScalarAsciiArt from '../../ScalarAsciiArt.vue'
import ResponseBody from './ResponseBody.vue'
import ResponseHeaders from './ResponseHeaders.vue'
import ResponseMetaInformation from './ResponseMetaInformation.vue'

const { activeResponse, activeRequestId } = useRequestStore()

// Headers
const responseHeaders = computed(() => {
  const headers = activeResponse.value?.headers

  return headers
    ? Object.keys(headers)
        .map((key) => ({ name: key, value: headers[key] }))
        .filter(
          (item) =>
            ![
              'rest-api-client-content-length',
              'X-API-Client-Content-Length',
            ].includes(item.name),
        )
    : []
})

// Cookies
const responseCookies = computed(() => {
  const cookies = activeResponse.value?.cookies

  return cookies
    ? Object.keys(cookies).map((key) => ({ name: key, value: cookies[key] }))
    : []
})

// Pretty print JSON
const responseData = computed(() => {
  const value = activeResponse.value?.data

  // Format JSON
  if (value && isJsonString(value)) {
    return JSON.stringify(JSON.parse(value as string), null, 2)
  } else if (value && typeof toRaw(value) === 'object') {
    return JSON.stringify(value, null, 2)
  }
  if (value && !isJsonString(value)) {
    return JSON.stringify(value, null, 2)
  }

  return value
})
</script>
<template>
  <div class="scalar-api-client__main__right custom-scroll">
    <div class="scalar-api-client__main__content">
      <div class="scalar-api-client__main__content__header">
        <label>Response</label>
        <div
          v-if="activeRequestId && activeResponse"
          class="meta">
          <ResponseMetaInformation :response="activeResponse" />
        </div>
      </div>
      <template v-if="activeRequestId && activeResponse">
        <div class="scalar-api-client__main__content__body">
          <ResponseBody
            :active="!!activeResponse"
            :data="responseData"
            :headers="responseHeaders" />
          <ResponseHeaders :headers="responseHeaders" />
          <CollapsibleSection title="Cookies">
            <SimpleGrid
              v-show="responseCookies.length > 0"
              :items="responseCookies" />
            <template v-if="responseCookies.length === 0">
              <div class="scalar-api-client__empty-state">No Cookies</div>
            </template>
          </CollapsibleSection>
          <div class="scalar-api-client__main__scroll-container" />
        </div>
      </template>
      <template v-else>
        <div class="scalar-api-client__main__content empty-state">
          <ScalarAsciiArt :art="Computer" />
          <p>Fill the void and send your request</p>
        </div>
      </template>
    </div>
  </div>
</template>
<style>
.scalar-api-client__main__right {
  width: 50%;
}
@media screen and (max-width: 820px) {
  .scalar-api-client__main__right {
    border-right: none;
    height: 100%;
    width: 100%;
  }
}
.scalar-api-client__main__right :deep(.scalar-copilot__header-button) {
  position: absolute;
  top: 6px;
  right: 12px;
}
.scalar-api-client__main__content .empty-state {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 50px);
  justify-content: center;
}
.scalar-api-client__main__content .empty-state p {
  color: var(--scalar-color-2);
  font-size: var(--scalar-small);
  text-transform: capitalize;
}
</style>
