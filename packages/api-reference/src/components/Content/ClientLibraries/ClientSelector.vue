<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { TargetId } from 'httpsnippet-lite'
import type { AvailableTarget } from 'httpsnippet-lite/dist/types/helpers/utils'
import type { ClientInfo } from 'httpsnippet-lite/dist/types/targets/targets'
import { ref } from 'vue'

import { useHttpClients } from '../../../hooks'
import { type HttpClientState, useHttpClientStore } from '../../../stores'

// Use the template store to keep it accessible globally
const { httpClient, setHttpClient, getClientTitle, getTargetTitle } =
  useHttpClientStore()
const { availableTargets } = useHttpClients()

const containerRef = ref<HTMLElement>()

// Show popular clients with an icon, not just in a select.
const featuredClients = (
  [
    {
      targetKey: 'shell',
      clientKey: 'curl',
    },
    {
      targetKey: 'ruby',
      clientKey: 'native',
    },
    {
      targetKey: 'node',
      clientKey: 'undici',
    },
    {
      targetKey: 'php',
      clientKey: 'guzzle',
    },
    {
      targetKey: 'python',
      clientKey: 'python3',
    },
  ] as const
).filter((featuredClient) =>
  availableTargets.value.find((target: AvailableTarget) => {
    return (
      target.key === featuredClient.targetKey &&
      target.clients.find(
        (client: ClientInfo) => client.key === featuredClient.clientKey,
      )
    )
  }),
)

/**
 * Icons have longer names to appear in icon searches, e.g. "javascript-js" instead of just "javascript". This function
 * maps the language key to the icon name.
 */
const getIconByLanguageKey = (targetKey: TargetId) =>
  `programming-language-${targetKey}` as const

const isSelectedClient = (language: HttpClientState) => {
  return (
    language.targetKey === httpClient.targetKey &&
    language.clientKey === httpClient.clientKey
  )
}

const checkIfClientIsFeatured = (client: HttpClientState) =>
  featuredClients.some(
    (item) =>
      item.targetKey === client.targetKey &&
      item.clientKey === client.clientKey,
  )
</script>
<template>
  <div
    ref="containerRef"
    class="client-libraries-content">
    <div
      v-for="client in featuredClients"
      :key="client.clientKey"
      class="client-libraries rendered-code-sdks"
      :class="{
        'client-libraries__active': isSelectedClient(client),
      }"
      @click="() => setHttpClient(client)">
      <div :class="`client-libraries-icon__${client.targetKey}`">
        <ScalarIcon
          class="client-libraries-icon"
          :icon="getIconByLanguageKey(client.targetKey)" />
      </div>
      <span>{{ getTargetTitle(client) }}</span>
    </div>

    <div
      class="client-libraries client-libraries__select"
      :class="{
        'client-libraries__active':
          httpClient && !checkIfClientIsFeatured(httpClient),
      }">
      <select
        class="language-select"
        :value="JSON.stringify(httpClient)"
        @input="
          (event) =>
            setHttpClient(JSON.parse((event.target as HTMLSelectElement).value))
        ">
        <optgroup
          v-for="target in availableTargets"
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
            {{
              getClientTitle({
                targetKey: target.key,
                clientKey: client.key,
              })
            }}
          </option>
        </optgroup>
      </select>

      <div class="client-libraries-icon__more">
        <template v-if="httpClient && !checkIfClientIsFeatured(httpClient)">
          <div :class="`client-libraries-icon__${httpClient.targetKey}`">
            <ScalarIcon
              class="client-libraries-icon"
              :icon="getIconByLanguageKey(httpClient.targetKey)" />
          </div>
        </template>
        <template v-else>
          <svg
            class="client-libraries-icon"
            height="50"
            viewBox="0 0 50 50"
            width="50"
            xmlns="http://www.w3.org/2000/svg">
            <g
              fill="currentColor"
              fill-rule="nonzero">
              <path
                d="M10.71 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M21.13 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0M31.55 25.3a3.87 3.87 0 1 0 7.74 0 3.87 3.87 0 0 0-7.74 0" />
            </g>
          </svg>
        </template>
      </div>
      <span>More</span>
    </div>
  </div>
</template>
<style scoped>
.client-libraries-content {
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 3px;
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
}
.client-libraries {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  padding: 5px;
  gap: 6px;
  color: var(--scalar-color-3);
  border-radius: var(--scalar-radius);
  border: 0.5px solid transparent;
  user-select: none;
}
.client-libraries:hover {
  color: var(--scalar-color-1);
}
/* remove php and c on mobile */
@media screen and (max-width: 450px) {
  .client-libraries:nth-of-type(4),
  .client-libraries:nth-of-type(5) {
    display: none;
  }
}
.client-libraries-icon {
  max-width: 14px;
  max-height: 14px;
  min-width: 14px;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  color: currentColor;
}
.client-libraries-icon__more svg {
  height: initial;
}
.client-libraries__active {
  background-color: var(--scalar-background-2);
  color: var(--scalar-color-1);
  border-color: var(--scalar-border-color);
  filter: brightness(var(--scalar-lifted-brightness));
}
@keyframes codeloader {
  0% {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(1turn);
  }
}
.client-libraries span {
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
}
.client-libraries__active span {
  color: var(--scalar-color-1);
}
.client-libraries__select select {
  opacity: 0;
  height: 100%;
  width: 100%;
  aspect-ratio: 1;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
  z-index: 1;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  border: none;
}
.client-libraries__select span {
  position: relative;
  display: flex;
  align-items: center;
}
@media screen and (max-width: 600px) {
  .references-classic .client-libraries {
    flex-direction: column;
  }
}
</style>
