<script lang="ts" setup>
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { CodeMirror } from '@scalar/use-codemirror'
import { ref } from 'vue'

import { mapFromObject } from '../../../../helpers'
import { Icon } from '../../../Icon'

const props = defineProps<{ examples: Record<string, any> }>()

const examples = mapFromObject(props.examples)
const selectedExample = ref(examples[0])
</script>
<template>
  <div class="example-switcher">
    <label
      class="listbox-label"
      for="listbox-button">
      Select Example
    </label>
    <Listbox v-model="selectedExample">
      <ListboxButton
        id="listbox-button"
        class="listbox-button">
        <div class="listbox-button-content">
          <div class="listbox-button-label">
            {{ selectedExample.value.summary ?? selectedExample.key }}
          </div>
          <div>
            <Icon
              class="icon"
              src="line/arrow-chevron-down" />
          </div>
        </div>
      </ListboxButton>

      <ListboxOptions class="listbox-options">
        <ListboxOption
          v-for="example in examples"
          :key="example.key"
          class="listbox-option"
          :value="example">
          {{ example.value.summary ?? example.key }}
        </ListboxOption>
      </ListboxOptions>
    </Listbox>
    <CodeMirror
      :content="JSON.stringify(selectedExample.value.value, null, 2)"
      :languages="['json']"
      readOnly />
  </div>
</template>

<style scoped>
.example-switcher {
  display: flex;
  gap: 6px;
  flex-direction: column;
}

.listbox-label {
  font-size: var(--theme-mini);
  font-weight: var(--theme-semibold);
  margin: 0 4px;
  color: var(--theme-color-2);
}

.listbox-button {
  border: 1px solid var(--theme-border-color);
  background: var(--theme-background-1);
  padding: 6px 12px;
  border-radius: var(--theme-radius);
  text-align: left;
  display: block;
  font-size: var(--theme-mini);
}

.listbox-button-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.listbox-button-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.listbox-options {
  background: var(--theme-background-1);
  padding: 6px 6px;
  border-radius: var(--theme-radius-lg);
  margin-top: 4px;
  box-shadow: var(--theme-shadow-2);
  position: absolute;
  margin: 0 1px;
  transform: translateY(-50%);
  z-index: 100;
}

.listbox-option {
  padding: 6px 12px;
  cursor: pointer;
  color: var(--theme-color-1);
  border-radius: var(--theme-radius);
  margin: 2px 0;
}

.listbox-option[data-headlessui-state='selected'] {
  background: var(--theme-background-2);
}

.listbox-option:hover {
  background: var(--theme-background-2);
  color: var(--theme-color-2);
}

.icon {
  width: 13px;
  height: 13px;
  color: var(--theme-color-3);
}
</style>
