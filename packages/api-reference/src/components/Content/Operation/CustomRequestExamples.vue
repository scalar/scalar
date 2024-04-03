<script lang="ts" setup>
import { HttpMethod } from '@scalar/api-client'
import { ScalarCodeBlock, ScalarIcon } from '@scalar/components'
import type {
  CustomRequestExample,
  TransformedOperation,
} from '@scalar/oas-utils'
import { computed, ref, watch } from 'vue'

import { useClipboard } from '../../../hooks'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'
import TextSelect from './TextSelect.vue'

const props = defineProps<{
  operation: TransformedOperation
  examples: CustomRequestExample[]
}>()

const selectedExample = ref<number>(0)

const language = computed(() => {
  // Translate to what the CodeMirror component understands
  const languages = {
    'C': 'c',
    'C#': 'csharp',
    // 'C++': '',
    // 'CoffeeScript': '',
    // 'CSS': '',
    // 'Dart': '',
    // 'DM': '',
    // 'Elixir': '',
    'Go': 'go',
    // 'Groovy': '',
    'HTML': 'html',
    'Java': 'java',
    'JavaScript': 'javascript',
    'Kotlin': 'kotlin',
    'Objective-C': 'objc',
    // 'Perl': '',
    // 'PHP': '',
    'PowerShell': 'powershell',
    'Python': 'python',
    'Ruby': 'ruby',
    // 'Rust': '',
    // 'Scala': '',
    'Shell': 'shell',
    'Swift': 'swift',
    'TypeScript': 'javascript',
    'cURL': 'shell',
  }

  return (
    // @ts-ignore
    languages[props.examples[selectedExample.value].lang as string] ??
    props.examples[selectedExample.value].lang
  )
})

const currentExample = computed(() => {
  return props.examples[selectedExample.value]
})

watch(props.examples, () => {
  // @ts-ignore
  if (props.examples[selectedExample.value] === 'undefined') {
    selectedExample.value = 0
  }
})

const { copyToClipboard } = useClipboard()
</script>
<template>
  <Card class="dark-mode">
    <CardHeader muted>
      <div class="request-header">
        <HttpMethod
          class="request-method"
          :method="operation.httpVerb" />
        <slot name="header" />
      </div>
      <template #actions>
        <TextSelect
          class="request-client-picker"
          :modelValue="selectedExample"
          :options="
            examples.map((example, index) => {
              return {
                value: index.toString(),
                label: example.label,
              }
            })
          "
          @update:modelValue="
            (value) => ((selectedExample = parseInt(value)), 10)
          ">
          {{ currentExample.label }}
        </TextSelect>
        <button
          class="copy-button"
          type="button"
          @click="copyToClipboard(currentExample.source.trim())">
          <ScalarIcon
            icon="Clipboard"
            width="10px" />
        </button>
      </template>
    </CardHeader>
    <CardContent
      borderless
      class="request-editor-section custom-scroll"
      frameless>
      <ScalarCodeBlock
        :content="currentExample.source.trim()"
        :lang="language"
        lineNumbers />
    </CardContent>
    <CardFooter
      v-if="$slots.footer"
      class="scalar-card-footer"
      contrast>
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>

<style scoped>
.request {
  display: flex;
  flex-wrap: nowrap;
}
.request-header {
  display: flex;
  gap: 6px;
  text-transform: initial;
}
.request-method {
  font-family: var(--scalar-font-code);
  text-transform: uppercase;
  white-space: nowrap;
}
.request-client-picker {
  padding-left: 12px;
  padding-right: 9px;
  border-right: 1px solid var(--scalar-border-color);
}
.copy-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--scalar-color-3);
  margin-left: 6px;
  margin-right: 10.5px;
  border: none;
  border-radius: 3px;
  padding: 0;
  display: flex;
  align-items: center;
  height: fit-content;
}
/* Can't use flex align center on parent (scalar-card-header-actions) so have to match sibling font size vertically align*/
.copy-button:after {
  content: '.';
  color: transparent;
  font-size: var(--scalar-mini);
  line-height: 1.35;
  width: 0px;
}
.copy-button:hover {
  color: var(--scalar-color-1);
}

.copy-button svg {
  width: 13px;
  height: 13px;
}

.scalar-card-header-actions {
  display: flex;
}
.scalar-card-footer {
  display: flex;
  justify-content: flex-end;
  padding: 6px;
}
.request-editor-section {
  display: flex;
  flex: 1;
}
</style>
