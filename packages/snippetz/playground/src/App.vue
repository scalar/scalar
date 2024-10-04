<script setup lang="ts">
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { ref } from 'vue'

import CodeExample from './components/CodeExample.vue'

const selectedTarget = ref<TargetId>('node')
const selectedClient = ref<ClientId>('undici')
function selectPlugin(plugin: { target: TargetId; client: ClientId }) {
  selectedTarget.value = plugin.target
  selectedClient.value = plugin.client
}
</script>

<template>
  <h1>Snippetz</h1>

  <div class="introduction">
    <p>
      @scalar/snippetz is a library that generates code snippets for making HTTP
      requests in Node.js and the browser.
    </p>
  </div>

  <h2>Clients</h2>

  <button
    v-for="plugin in snippetz().plugins()"
    :key="plugin.client"
    class="client"
    :class="{
      'client--selected':
        selectedClient === plugin.client && selectedTarget === plugin.target,
    }"
    type="button"
    @click="
      () => {
        selectPlugin(plugin)
      }
    ">
    {{ plugin.target }}/{{ plugin.client }}
  </button>

  <h2>Examples</h2>

  <div class="examples">
    <CodeExample
      :client="selectedClient"
      :request="{ url: 'https://example.com' }"
      :target="selectedTarget" />
    <CodeExample
      :client="selectedClient"
      :request="{ url: 'https://example.com', method: 'POST' }"
      :target="selectedTarget" />
    <CodeExample
      :client="selectedClient"
      :request="{
        url: 'https://example.com',
        method: 'POST',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json',
          },
        ],
      }"
      :target="selectedTarget" />
    <CodeExample
      :client="selectedClient"
      :request="{
        url: 'https://example.com',
        method: 'POST',
        headers: [
          {
            name: 'Content-Type',
            value: 'application/json; charset=utf-8',
          },
        ],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify({ hello: 'world' }),
        },
      }"
      target="node" />
  </div>
</template>

<style scoped>
h1,
h2 {
  font-size: 1.2rem;
  margin: 2rem 0;
}
.introduction {
  margin-bottom: 2rem;
  max-width: 500px;
  line-height: 1.6;
  font-size: 1.2rem;
}
.examples {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.client {
  background: transparent;
  font-size: 1rem;
  border: 2px solid #343a40;
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 0 6px 6px 0;
  cursor: pointer;
}
.client--selected {
  background: #343a40;
}
</style>
