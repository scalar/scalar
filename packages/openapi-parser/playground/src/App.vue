<script setup lang="ts">
import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { watchDebounced } from '@vueuse/core'
import { onMounted, ref, watch } from 'vue'
import JsonViewer from 'vue-json-viewer'

const value = ref(
  JSON.stringify(
    {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },
      components: {
        requestBodies: {
          Foobar: {
            content: {},
          },
        },
      },
    },
    null,
    2,
  ),
)

const result = ref({})

onMounted(() => {
  const savedValue = window.localStorage.getItem('value')

  if (savedValue) {
    value.value = savedValue
  }
})

watch(value, async (newValue) => {
  window.localStorage.setItem('value', newValue)
})

watchDebounced(
  value,
  async (newValue) => {
    const { filesystem } = await load(newValue, {
      plugins: [fetchUrls()],
    })

    const { schema } = await dereference(filesystem)

    if (schema) {
      result.value = schema
    }
  },
  {
    debounce: 500,
    maxWait: 1000,
    immediate: true,
  },
)
</script>

<template>
  <div class="preview">
    <div class="preview-left">
      <textarea
        id=""
        v-model="value"
        cols="30"
        name=""
        rows="10"
        spellcheck="false" />
    </div>
    <div class="preview-right">
      <JsonViewer
        :expandDepth="3"
        :value="result"></JsonViewer>
    </div>
  </div>
</template>

<style>
.preview {
  padding: 20px;
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: stretch;
  height: 100%;
  gap: 20px;
}

.preview-left {
  width: 50%;
  height: 100%;
  display: flex;
}

.preview-right {
  width: 50%;
  height: 100%;
  font-size: 1rem;
  border-radius: 5px;
  overflow: auto;
  border: 1px solid #ccc;
}

textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 0;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  font-family: monospace;
  border: 1px solid #ccc;
  padding: 15px 20px;
  border-radius: 5px;
}

.jv-container .jv-code {
  padding: 20px;
}

pre {
  margin: 0;
}
</style>
