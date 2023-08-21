<script lang="ts" setup>
import { StatesArray } from '@hocuspocus/provider';
import { SwaggerSpec, parseSwaggerFile } from '@scalar/swagger-parser';
import { useDebounceFn } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useOperation } from '@scalar/api-client';
import Fuse from 'fuse.js';

import SwaggerEditorHeader from './SwaggerEditorHeader.vue';
import SwaggerEditorInput from './SwaggerEditorInput.vue';
import SwaggerEditorNotification from './SwaggerEditorNotification.vue';
import SwaggerEditorStatusBar from './SwaggerEditorStatusBar.vue';

defineProps<{
  documentName?: string
  token?: string
  username?: string
  hocusPocusUrl?: string
}>()

const emit = defineEmits<{
  (e: 'awarenessUpdate', states: StatesArray): void;
  (e: 'contentUpdate', value: string): void;
  (e: 'specUpdate', spec: SwaggerSpec): void;
  (e: 'import', value: string): void;
}>();

const parserError = ref<string>('');
const text = ref<string>('');
const result = ref<any[]>([]);
let data: any[] = [];
const fuse = new Fuse(data, {
  keys: ['title', 'description', 'body']
});

const formatProperty = (key: string, obj: any): string => {
  let output = key;
  const isRequired = obj.required && obj.required.includes(key);
  output += isRequired ? ' REQUIRED ' : ' optional ';
  output += obj.properties[key].type;

  if (obj.properties[key].description) {
    output += ' ' + obj.properties[key].description;
  }

  return output;
};

const recursiveLogger = (obj: any): string[] => {
  const results: string[] = ['Body'];

  for (let key in obj.properties) {
    results.push(formatProperty(key, obj));

    const isNestedObject = obj.properties[key].type === 'object' && obj.properties[key].properties;
    if (isNestedObject) {
      for (let subKey in obj.properties[key].properties) {
        results.push(`${subKey} ${obj.properties[key].properties[subKey].type}`);
      }
    }
  }

  return results;
};

const extractRequestBody = (operation: any): string[] | boolean => {
  try {
    const body = operation.information.requestBody.content['application/json'].schema;
    return recursiveLogger(body);
  } catch (error) {
    console.log('No Body :)');
    return false;
  }
};

const handleSpecUpdate = useDebounceFn((value: string) => {
  parseSwaggerFile(value)
    .then((spec: SwaggerSpec) => {
      data = [];
      parserError.value = '';
      console.log('spec', spec);

      for (let tag of spec.tags) {
        const payload = {
          title: tag.name,
          description: tag.description,
          body: "",
        };
        data.push(payload);

        for (let operation of tag.operations) {
          const { parameterMap } = useOperation({ operation });
          let bodyData = extractRequestBody(operation) || parameterMap.value;

          const payload = {
            title: operation.name,
            description: operation.description,
            body: bodyData,
            tag: tag.name,
            operation: operation.operationId,
          };

          data.push(payload);
        }
      }

      console.log(data);
      fuse.setCollection(data);
      emit('specUpdate', spec);
    })
    .catch((error: Error) => {
      parserError.value = error.toString();
    })
});

const fuseSearch = (): void => {
  console.log(text.value);
  result.value = fuse.search(text.value);
  console.log(result.value);
}

const handleHyperLinkClick = (value: string): void => {
  const elementId = `endpoint/${value}`;
  console.log(elementId);
  const element = document.getElementById(elementId);
  element?.scrollIntoView({ behavior: 'smooth' });
}

const handleContentUpdate = (value: string) => {
  emit('contentUpdate', value)
  handleSpecUpdate(value)
}

// Keep track of the present users
const awarenessStates = ref<number>(0)
const handleAwarenessUpdate = (states: StatesArray) => {
  awarenessStates.value = states.length
}

// Import new content
const importHandler = (value: string) => {
  codeMirrorReference.value?.setCodeMirrorContent(value)
}

const codeMirrorReference = ref<typeof SwaggerEditorInput | null>(null)

const formattedError = computed(() => {
  // Handle YAMLExceptions
  if (parserError.value?.startsWith('YAMLException:')) {
    // Trim everything but the first line
    return parserError.value.split('\n')[0]
  }

  return parserError.value
})
</script>
<template>
  <div class="code-editor">
    <input v-model="text" @input="fuseSearch" type="text" style="background: #f2f2f2; border: 1px solid #ccc; padding: 8px; border-radius: 4px;">

<div v-for="entry in result" :key="entry.refIndex" class="item-entry" style="margin-bottom: 12px;">
  <h3 style="margin-top: 0; font-size: 1.2em;">{{ entry.item.title }}</h3>
  <button @click="handleHyperLinkClick(entry.item.operation)" style="background: #4CAF50; color: #fff; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;">GO TO {{entry.item.operation}}</button>
</div>
  <SwaggerEditorHeader @import="importHandler" />
  <SwaggerEditorNotification v-if="formattedError">
    {{ formattedError }}
  </SwaggerEditorNotification>
  <SwaggerEditorInput
    ref="codeMirrorReference"
    :documentName="documentName"
    :token="token"
    :username="username"
    @awarenessUpdate="handleAwarenessUpdate"
    @contentUpdate="handleContentUpdate" />
  <SwaggerEditorStatusBar v-if="documentName">
    {{ awarenessStates }} user{{ awarenessStates === 1 ? '' : 's' }} online
  </SwaggerEditorStatusBar>
</div>
</template>

<style scoped>
.code-editor {
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;
  overflow: auto;
  border-right: 1px solid var(--theme-border-color);
}
</style>
