<script lang="ts" setup>
import { standardLanguages, syntaxHighlight } from '@scalar/code-highlight'
import { ScalarIconCopy } from '@scalar/icons'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { computed } from 'vue'

/**
 * Uses highlight.js for syntax highlighting
 */
const props = withDefaults(
  defineProps<{
    content: string | object
    lang?: string
    lineNumbers?: boolean
    hideCredentials?: string | string[]
    copy?: boolean
  }>(),
  {
    lang: 'plaintext',
    lineNumbers: false,
    copy: true,
  },
)

const highlightedCode = computed(() => {
  const html = syntaxHighlight(prettyPrintJson(props.content), {
    lang: props.lang.trim(),
    languages: standardLanguages,
    lineNumbers: props.lineNumbers,
    maskCredentials: props.hideCredentials,
  })

  // Need to remove the wrapping <pre> element so we can use v-html without another wrapper
  return html.slice(5, -6)
})

const { copyToClipboard } = useClipboard()

const isContentValid = computed(() => {
  return (
    props.content !== null &&
    props.content !== 'null' &&
    props.content !== '404 Not Found'
  )
})
</script>
<template>
  <div
    class="scalar-code-block custom-scroll min-h-12 focus-visible:outline"
    tabindex="0">
    <div
      v-if="copy"
      class="scalar-code-copy">
      <button
        v-if="isContentValid"
        class="copy-button"
        type="button"
        @click="copyToClipboard(prettyPrintJson(props.content))">
        <span class="sr-only">Copy content</span>
        <ScalarIconCopy class="size-4" />
      </button>
    </div>
    <pre
      class="scalar-codeblock-pre"
      v-html="highlightedCode" />
  </div>
</template>
<style>
@import '@scalar/code-highlight/css/code.css';
.scalar-code-block {
  background: inherit;
  position: relative;
  overflow: auto;
  padding: 0.75rem;
}
.scalar-code-block:hover .copy-button,
.copy-button:focus-visible {
  opacity: 100;
}
/* Code blocks */
.scalar-codeblock-pre {
  all: unset;
  margin: 0;
  background: transparent;
  text-wrap: nowrap;
  white-space-collapse: preserve;
  border-radius: 0;
  width: fit-content;
}
/* Copy Button */
.scalar-code-copy {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;

  position: sticky;
  inset: 0;
}
.copy-button {
  position: relative;
  top: 0px;
  right: 0px;

  display: flex;
  align-items: center;

  background-color: var(--scalar-background-2);
  border: 1px solid var(--scalar-border-color);
  border-radius: 3px;
  color: var(--scalar-color-3);
  cursor: pointer;
  height: 30px;
  margin-bottom: -30px;
  opacity: 0;
  padding: 5px;
  transition:
    opacity 0.15s ease-in-out,
    color 0.15s ease-in-out;
}
.scalar-code-copy,
.copy-button {
  /* Pass down the background color */
  background: inherit;
}
.copy-button:hover {
  color: var(--scalar-color-1);
}
.copy-button svg {
  stroke-width: 1.5;
}
</style>
