<script lang="ts" setup>
import {
  type CodeBlockSSRKey,
  type SSRState,
  createHash,
  ssrState,
} from '@scalar/oas-utils'
import prismjs from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import {
  computed,
  nextTick,
  onMounted,
  onServerPrefetch,
  ref,
  useSSRContext,
  watch,
} from 'vue'

import { prettyPrintString } from './utils/prettyPrintString'

/**
 * Uses prism.js for syntax highlighting
 * Comes with js, css, bash and json
 * Other languages are loaded async
 *
 * @link https://prismjs.com/
 */

const props = withDefaults(
  defineProps<{
    content: string | object
    lang?: string
    lineNumbers?: boolean
    hideCredentials?: string | string[]
  }>(),
  {
    lang: 'js',
    lineNumbers: false,
  },
)

const ssrHash = createHash(prettyPrintString(props.content))

const ssrStateKey =
  `components-scalar-code-block${ssrHash}` satisfies CodeBlockSSRKey

/**
 * The requested module 'prismjs' is a CommonJS module, which may not support all module.exports as named exports.
 * CommonJS modules can always be imported via the default export, for example using:
 */
const { plugins, highlightElement } = prismjs

// THis plugin hides given credentials from the snippet
if (props.hideCredentials) {
  prismjs.hooks.add('wrap', function (env) {
    // Skip early
    if (!props.hideCredentials) {
      return
    }

    let showsCredentials = false

    // Check if the content includes the hideCredentials string or any of the strings in the array
    if (typeof props.hideCredentials === 'string') {
      if (env.content.includes(props.hideCredentials)) {
        showsCredentials = true
      }
    } else if (Array.isArray(props.hideCredentials)) {
      showsCredentials = props.hideCredentials.some((token) =>
        env.content.includes(token),
      )
    }

    // Wrap all occurrences of hideCredentials (string or array of strings) with a span
    if (showsCredentials) {
      // Clean up the matches from previously added markup first
      env.content = env.content.replace(
        /<span class="credentials">.*?<\/span>/g,
        (match) => match.replace(/<span class="credentials">|<\/span>/g, ''),
      )

      // Wrap the matches with a span
      env.content = env.content.replace(
        new RegExp(
          typeof props.hideCredentials === 'string'
            ? props.hideCredentials
            : props.hideCredentials.join('|'),
          'g',
        ),
        (match) => `<span class="credentials">${match}</span>`,
      )
    }
  })
}

const el = ref(null)
const ssrContent = ref(ssrState[ssrStateKey] ?? '')

const language = computed(() => {
  return props.lang === 'node' ? 'js' : props.lang
})
const originalLang = props.lang

// Update the syntax highlight on lang change
watch(
  [() => props.lang, () => props.content, el],
  () => {
    // Ensure everything has loaded before applying client side highlighting
    // Also for SSR only apply client side after changing the language
    if (
      el.value &&
      props.content &&
      (!ssrContent.value || props.lang !== originalLang)
    ) {
      ssrContent.value = ''
      nextTick(() => highlightElement(el.value!))
    }
  },
  { immediate: true },
)

const NEW_LINE_EXP = /\n(?!$)/g

/**
 * We want to render the syntax highlight on the server first
 * The line numbers plugin is front-end only so we handle it ourselves on the server
 * TODO we can get rid of the front-end plugin as well and just use this method
 * @see https://stackoverflow.com/a/59577306
 */
onServerPrefetch(async () => {
  let lineNumbers = ''

  if (props.lineNumbers) {
    prismjs.hooks.add('after-tokenize', (env) => {
      const match = env.code.match(NEW_LINE_EXP)
      const linesNum = match ? match.length + 1 : 1
      const lines = new Array(linesNum + 1).join('<span></span>')
      lineNumbers = `<span aria-hidden="true" class="line-numbers-rows">${lines}</span>`
    })
  }

  const html = prismjs.highlight(
    prettyPrintString(props.content),
    prismjs.languages[language.value]!,
    language.value,
  )

  ssrContent.value = html + lineNumbers

  // Make sure we aren't storing 0s
  if (ssrHash !== 0) {
    const ctx = useSSRContext<SSRState>()
    ctx!.payload.data[ssrStateKey] = html + lineNumbers
  }
})

// Here we overwrite the SSR with client rendered syntax highlighting
onMounted(async () => {
  // This bit async autoloads any syntax we have not pre-loaded
  await import('prismjs/plugins/autoloader/prism-autoloader.js')
  plugins.autoloader.languages_path =
    'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/'
})
</script>
<template>
  <pre
    :class="[
      `scalar-component scalar-codeblock-pre language-${language}`,
      {
        'line-numbers': lineNumbers,
      },
    ]"><!--
        SSR generated highlighting
        * Do not remove these strange comments and line breaks as any line breaks
          inside of pre will show in the dom
      --><code v-if="ssrContent" :class="`scalar-codeblock-code language-${language}`" v-html="prettyPrintString(ssrContent)" /><!--
        Client side generated highlighting
      --><code v-else ref="el" :class="`scalar-codeblock-code language-${language}`">{{prettyPrintString(content)}}</code></pre>
</template>
<style>
.scalar-codeblock-code[class*='language-'],
.scalar-codeblock-pre[class*='language-'] {
  color: var(--scalar-color-2);
  background: none;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  line-height: 1.4;

  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;

  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;

  display: block;
}

/* Code blocks */
.scalar-codeblock-pre[class*='language-'] {
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
}

:not(pre) > code[class*='language-'],
.scalar-codeblock-pre[class*='language-'] {
  background: var(--scalar-background-2);
}

/* Line Numbers */
.line-numbers.scalar-codeblock-pre[class*='language-'] {
  position: relative;
  padding-left: 2em;
  counter-reset: linenumber;
}

.line-numbers > code {
  position: relative;
  white-space: inherit;
}

.line-numbers .line-numbers-rows {
  position: absolute;
  pointer-events: none;
  top: 0;
  font-size: 100%;
  left: -3em;
  width: 3em;
  letter-spacing: -1px;
  user-select: none;
}

.line-numbers-rows > span {
  display: block;
  counter-increment: linenumber;
}

.line-numbers-rows > span:before {
  content: counter(linenumber);
  color: #999;
  display: block;
  padding-right: 0.8em;
  text-align: right;
}

/* Inline code */
:not(pre) > code[class*='language-'] {
  padding: 0.1em;
  border-radius: 0.3em;
  white-space: normal;
}

/* Code */
.token.comment,
.token.block-comment,
.token.prolog,
.token.doctype,
.token.cdata {
  color: var(--scalar-color-2);
}

.token.punctuation {
  color: var(--scalar-color-3);
}

.token.tag,
.token.attr-name,
.token.namespace,
.token.deleted {
  color: var(--scalar-color-red);
}

.token.function-name {
  color: var(--scalar-color-green);
}

.token.boolean,
.token.number,
.token.function {
  color: var(--scalar-color-orange);
}

.token.property,
.token.class-name,
.token.constant,
.token.symbol {
  color: var(--scalar-color-1);
}

.token.selector,
.token.important,
.token.atrule,
.token.keyword,
.token.builtin {
  color: var(--scalar-color-purple);
}

.token.string,
.token.char,
.token.attr-value,
.token.regex,
.token.variable {
  color: var(--scalar-color-blue);
}

.light-mode .dark-mode .language-shell .token.variable {
  color: var(--scalar-color-1);
}
.light-mode .dark-mode .language-shell .token.string {
  color: var(--scalar-color-blue);
}
.language-shell .token.string {
  color: var(--scalar-color-1);
}
.token.operator,
.token.entity,
.token.url {
  color: var(--scalar-color-3);
}

.token.important,
.token.bold {
  font-weight: bold;
}
.token.italic {
  font-style: italic;
}

.token.entity {
  cursor: help;
}

.token.inserted {
  color: var(--scalar-color-green);
}

/** Hide credentials */
.credentials {
  font-size: 0;
  color: transparent;
}

/** Show a few dots instead */
.credentials::after {
  content: '·····';
  font-size: var(--scalar-small);
  color: var(--scalar-color-3);
}
</style>
