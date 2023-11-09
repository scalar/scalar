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

// we never set the key properly, but i figured people might also have a key field
// so i added a scalar exclusive field to fallback to that uses the key of the object
const examples = mapFromObject(props.examples, 'scalarExampleName')
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
            {{
              selectedExample.value.summary ??
              selectedExample.key ??
              selectedExample.scalarExampleName
            }}
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
          {{
            example.value.summary ?? example.key ?? example.scalarExampleName
          }}
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
  margin: 12px 6px;
  flex-direction: column;
}

.listbox-label {
  font-size: var(--theme-mini, var(--default-theme-mini));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  margin: 0 4px;
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.listbox-button {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  background: var(--theme-background-1, var(--default-theme-background-1));
  padding: 6px 12px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  text-align: left;
  display: block;
  font-size: var(--theme-mini, var(--default-theme-mini));
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
  background: var(--theme-background-1, var(--default-theme-background-1));
  padding: 6px 6px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  margin-top: 4px;
  box-shadow: var(--theme-shadow-2, var(--default-theme-shadow-2));
  position: absolute;
  margin: 0 1px;
  transform: translateY(-50%);
  z-index: 100;
}

.listbox-option {
  padding: 6px 12px;
  cursor: pointer;
  color: var(--theme-color-1, var(--default-theme-color-1));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  margin: 2px 0;
}

.listbox-option[data-headlessui-state='selected'] {
  background: var(--theme-background-2, var(--default-theme-background-2));
}

.listbox-option:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.icon {
  width: 13px;
  height: 13px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
</style>
