<script setup lang="ts">
import { watch, ref, toRefs, toRef }  from 'vue';
import type { Spec, Operation } from '../types';
import FlowModal, { useModalState } from './FlowModal.vue';
import { useTemplateStore } from '../stores/template';
import { useOperation } from '@scalar/api-client';
import Fuse from 'fuse.js';
import { extractRequestBody } from '../helpers/specHelpers';

const props = defineProps<{ spec: Spec }>();
const reactiveSpec = toRef(props, 'spec');
const modalState = useModalState();
type FuseData  = {
  title: string;
  description: string;
  body: string | string[];
  tag?: string;
  operation?: string;
  httpVerb?: string;
}

type HyperlinkClickValue = {
  operation: string;
  tag: string;
}

let fuseDataArray: FuseData[] = [];
const fuseSearchResults = ref<Fuse.FuseResult<FuseData>[]>([]);
const searchText = ref<string>('');

const fuse = new Fuse(fuseDataArray, {
  keys: ['title', 'description', 'body']
});

const { state, setItem, setCollapsedSidebarItem } = useTemplateStore();

const fuseSearch = (): void => {
  fuseSearchResults.value = fuse.search(searchText.value);
};

watch(() => state.showSearch, () => {
  if (state.showSearch) {
    modalState.show();
  } else {
    modalState.hide();
  }
});

watch(() => modalState.open, () => {
  if (!modalState.open) {
    setItem('showSearch', false);
  }
});

function handleHyperLinkClick(value: HyperlinkClickValue): void {
  const { operation, tag } = value;
  setCollapsedSidebarItem(tag, true);

  modalState.hide();
  const elementId = `endpoint/${operation}`;
  const element = document.getElementById(elementId);
  element?.scrollIntoView();
}

watch(reactiveSpec.value, () =>  {
  fuseDataArray = [];
  props.spec.tags.forEach(tag => {
    const payload = {
      title: tag.name,
      description: tag.description,
      body: "",
    };
    fuseDataArray.push(payload);

    if (tag.operations) {
      tag.operations.forEach(operation => {
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

        fuseDataArray.push(payload);
      });
    }
  });

  fuse.setCollection(fuseDataArray);
});
</script>
<template>
    <FlowModal
        :state="modalState"
        title="Search">
        <div>
          <input placeholder="Search Here..." class="ref-search-input" v-model="searchText" @input="fuseSearch" type="text">
        </div>
        <div>
            <button v-for="entry in fuseSearchResults" :key="entry.refIndex" class="item-entry" @click="handleHyperLinkClick(entry.item)">
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