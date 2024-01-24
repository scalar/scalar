<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { useClipboard } from '@scalar/use-clipboard'
import { CodeMirror } from '@scalar/use-codemirror'
import { computed, ref, watch } from 'vue'

import type { CustomRequestExample, TransformedOperation } from '../../../types'
import { Card, CardContent, CardFooter, CardHeader } from '../../Card'

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
        <span
          class="request-method"
          :class="`request-method--${operation.httpVerb}`">
          {{ operation.httpVerb }}
        </span>
        <slot name="header" />
      </div>
      <template #actions>
        <div class="language-select">
          <span>{{ currentExample.label }}</span>
          <select
            :value="selectedExample"
            @input="
              (event) => (
                (selectedExample = parseInt(
                  (event.target as HTMLSelectElement).value,
                )),
                10
              )
            ">
            <option
              v-for="(example, index) in examples"
              :key="index"
              :value="index">
              {{ example.label }}
            </option>
          </select>
        </div>
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
      <CodeMirror
        :content="currentExample.source.trim()"
        :forceDarkMode="true"
        :languages="[language]"
        lineNumbers
        readOnly />
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
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  text-transform: uppercase;
}
.request-method--post {
  color: var(--theme-color-green, var(--default-theme-color-green));
}
.request-method--patch {
  color: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.request-method--get {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}
.request-method--delete {
  color: var(--theme-color-red, var(--default-theme-color-red));
}
.request-method--put {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}
.language-select {
  position: relative;
  padding-right: 9px;
  height: fit-content;
  padding-left: 12px;
  border-right: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.language-select select {
  border: none;
  outline: none;
  cursor: pointer;
  background: var(--theme-background-3, var(--default-theme-background-3));
  box-shadow: -2px 0 0 0
    var(--theme-background-3, var(--default-theme-background-3));
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}
.language-select span {
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.language-select:hover span {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.language-select span:after {
  content: '';
  width: 7px;
  height: 7px;
  transform: rotate(45deg) translate3d(-2px, -2px, 0);
  display: block;
  margin-left: 6px;
  box-shadow: 1px 1px 0 currentColor;
}
.language-select span:hover {
  background: var(--theme-background-2, var(--default-theme-background-2));
}

.copy-button {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  background: transparent;
  display: flex;
  cursor: pointer;
  color: var(--theme-color-3, var(--default-theme-color-3));
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
  font-size: var(--theme-mini, var(--default-theme-mini));
  line-height: 1.35;
  width: 0px;
}
.copy-button:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
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
