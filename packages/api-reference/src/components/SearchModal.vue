<script setup lang="ts">
import { watch, ref, toRefs, toRef }  from 'vue'
import type { Spec } from '../types'
import FlowModal, { useModalState} from './FlowModal.vue'
import { useTemplateStore } from '../stores/template'
import { useOperation } from '@scalar/api-client';
import Fuse from 'fuse.js';

const props = defineProps<{ spec: Spec }>()

const reactiveSpec = toRef(props, 'spec')

const modalState = useModalState() 

const result = ref<any[]>([]);
const text = ref<string>('');

const { state, setItem, setCollapsedSidebarItem } = useTemplateStore()

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
    // optional chaining
    const body = operation.information.requestBody.content['application/json'].schema;
    return recursiveLogger(body);
  } catch (error) {
    console.log('No Body :)');
    return false;
  }
};


const fuseSearch = (): void => {
  result.value = fuse.search(text.value);
}


watch(() => state.showSearch, () => {
  if (state.showSearch) {
    modalState.show()
  } else {
    modalState.hide()
  }
})

watch(() => modalState.open, () => {
  if (!modalState.open) {
    setItem('showSearch', false)
  }
})

const handleHyperLinkClick = (value: string): void => {
  // todo always open tag first
  // handles edge case where tag is not open
  // and can't scroll
  setCollapsedSidebarItem('tag', true)
  
  modalState.hide()
  const elementId = `endpoint/${value}`;
  const element = document.getElementById(elementId);
  element?.scrollIntoView();
}

watch(reactiveSpec.value, () =>  {
  data = [];
  for (let tag of props.spec.tags) {
    const payload = {
      title: tag.name,
      description: tag.description,
      body: "",
    };
    data.push(payload);
    if (tag.operations) {
      for (let operation of tag.operations) {
        const { parameterMap } = useOperation({ operation });
        let bodyData = extractRequestBody(operation) || parameterMap.value;

        const payload = {
          title: operation.name,
          description: operation.description,
          body: bodyData,
          tag: tag.name,
          operation: operation.operationId,
          httpVerb: operation.httpVerb,
        };

        data.push(payload);
      }
    }
  }

  fuse.setCollection(data);
})
</script>
<template>
    <FlowModal
        :state="modalState"
        title="Search">
        <div>
          <input placeholder="Search Here..." class="ref-search-input" v-model="text" @input="fuseSearch" type="text">
        </div>
        <div>
            <button v-for="entry in result" :key="entry.refIndex" class="item-entry" @click="handleHyperLinkClick(entry.item.operation)">
              <div class="item-entry-heading">
                <span>{{ entry.item.title }}</span>
                <i class="item-entry-verb" :class="entry.item.httpVerb">{{ entry.item.httpVerb }}</i>
              </div>
              <em>{{entry.item.operation}}</em>
            </button>
      </div>
    </FlowModal>
</template>
<style scoped>
.post {
  color: var(--theme-post-color);
}
.patch {
  color: var(--theme-patch-color);
}
.get {
  color: var(--theme-get-color);
}
.delete {
  color: var(--theme-delete-color);
}
.put {
  color: var(--theme-put-color);
}
.ref-search-input {
  width: 100%;
  background: transparent;
  padding: 12px;
  font-size: 13px;
  outline: none;
  border: 1px solid var(--theme-border-color);
  border-radius: var(--theme-radius);
  color: var(--theme-color-1);
  font-weight: var(--theme-semibold);
  font-size: var(--theme-font-size-3);
  appearance: none;
  margin-bottom: 12px;
}
.ref-search-input::-webkit-input-placeholder,
.ref-search-input::placeholder {
  color: var(--theme-color-3);
  font-family: var(--theme-font);
  font-weight: var(--theme-regular);
}
.item-entry {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  padding: 6px 0;
  width: 100%;
  font-size: var(--theme-font-size-3);
  text-align: left;
  border-bottom: 1px solid var(--theme-border-color)
}
.item-entry:hover {
  background: var(--theme-background-2);
  border-radius: var(--theme-radius);
  border-bottom-color: transparent;
  box-shadow: 0 0 0 1px var(--theme-background-2);
  width: calc(100% + 12px);
  padding: 6px;
  position: relative;
  left: -6px;
  z-index: 10;
}
.item-entry:has(+ .item-entry:hover) {
  border-bottom-color: transparent;
}
.item-entry em {
  display: none;
  font-size: var(--theme-font-size-4);
  color: var(--theme-color-3)
}
.item-entry:hover em {
  display: block;
}
.item-entry-verb {
  font-family: var(--theme-font-code);
  min-width: 100px; 
  display: inline-block;
  text-align: right;
}
.item-entry-heading {
  display: flex;
  justify-content: space-between;
}
</style>