<script setup lang="ts">
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { ref } from 'vue'

import CodeExample from './components/CodeExample.vue'

const { plugins } = snippetz()

const selectedTarget = ref<TargetId>('node')
const selectedClient = ref<ClientId<typeof selectedTarget.value>>('undici')

function selectPlugin<T extends TargetId>(plugin: {
  target: TargetId
  client: ClientId<T>
}) {
  selectedTarget.value = plugin.target
  selectedClient.value = plugin.client
}
</script>

<template>
  <h1>Scalar Snippetz</h1>

  <div class="badges">
    <a href="https://www.npmjs.com/package/@scalar/snippetz">
      <img
        alt="Version"
        src="https://img.shields.io/npm/v/%40scalar/snippetz" />
    </a>
    <a href="https://www.npmjs.com/package/@scalar/snippetz">
      <img
        alt="Downloads"
        src="https://img.shields.io/npm/dm/%40scalar/snippetz" />
    </a>
    <a href="https://www.npmjs.com/package/@scalar/snippetz">
      <img
        alt="License"
        src="https://img.shields.io/npm/l/%40scalar%2Fsnippetz" />
    </a>
    <a href="https://discord.gg/scalar">
      <img
        alt="Discord"
        src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2" />
    </a>
  </div>

  <div class="introduction">
    <p>
      @scalar/snippetz is a library that generates code snippets for making HTTP
      requests in Node.js and the browser.
    </p>
  </div>

  <h2>Available HTTP Clients</h2>

  <button
    v-for="plugin in plugins()"
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

  <h2>Source Code</h2>

  <div>
    <a href="https://github.com/scalar/scalar/tree/main/packages/snippetz">
      github.com/scalar/scalar/tree/main/packages/snippetz
    </a>
  </div>

  <h2>Usage</h2>

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
      :target="selectedTarget" />
  </div>
</template>

<style scoped>
h1,
h2 {
  font-size: 1.2rem;
  margin: 2rem 0;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
  border: 1px solid #2d2d2d;
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  margin: 0 6px 6px 0;
  cursor: pointer;
}
.client--selected {
  background-color: #2d2d2d;
}
</style>
