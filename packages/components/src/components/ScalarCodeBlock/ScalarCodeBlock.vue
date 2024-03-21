<script lang="ts" setup>
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
  watch,
} from 'vue'

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
const ssrContent = ref('')

const language = computed(() => {
  return props.lang === 'node' ? 'js' : props.lang
})

// Update the syntax highlight on lang change
watch(
  () => [props.lang, props.content],
  () => {
    if (el.value) nextTick(() => highlightElement(el.value!))
  },
)

// We want to render the syntax highlight on the server first
onServerPrefetch(async () => {
  const html = prismjs.highlight(
    typeof props.content === 'object'
      ? JSON.stringify(props.content)
      : props.content,
    prismjs.languages[language.value]!,
    language.value,
  )
  ssrContent.value = html
})

// Here we overwrite the SSR with client rendered syntax highlighting
onMounted(async () => {
  if (el.value) highlightElement(el.value)

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
    ]"><code ref="el" :class="`scalar-codeblock-code language-${language}`" v-html="ssrContent || content" /></pre>
</template>
<style>
.scalar-codeblock-code[class*='language-'],
.scalar-codeblock-pre[class*='language-'] {
  color: var(--theme-color-3, var(--default-theme-color-2));
  background: none;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-small, var(--default-theme-small));
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
}

/* Code blocks */
.scalar-codeblock-pre[class*='language-'] {
  margin: 0;
  padding: 0.5rem;
  overflow: auto;
}

:not(pre) > code[class*='language-'],
.scalar-codeblock-pre[class*='language-'] {
  background: var(--theme-background-2, var(--default-theme-background-2));
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
  color: var(--theme-color-2, var(--default-theme-color-2));
}

.token.punctuation {
  color: var(--theme-color-3, var(--default-theme-color-3));
}

.token.tag,
.token.attr-name,
.token.namespace,
.token.deleted {
  color: var(--theme-color-red, var(--default-theme-color-red));
}

.token.function-name {
  color: var(--theme-color-green, var(--default-theme-color-green));
}

.token.boolean,
.token.number,
.token.function {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}

.token.property,
.token.class-name,
.token.constant,
.token.symbol {
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.token.selector,
.token.important,
.token.atrule,
.token.keyword,
.token.builtin {
  color: var(--theme-color-purple, var(--default-theme-color-purple));
}

.token.string,
.token.char,
.token.attr-value,
.token.regex,
.token.variable {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}

.light-mode .dark-mode .language-shell .token.variable {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.light-mode .dark-mode .language-shell .token.string {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}
.language-shell .token.string {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.token.operator,
.token.entity,
.token.url {
  color: var(--theme-color-3, var(--default-theme-color-3));
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
  color: var(--theme-color-green, var(--default-theme-color-green));
}

/** Hide credentials */
.credentials {
  font-size: 0;
  color: transparent;
}

/** Show a few dots instead */
.credentials::after {
  content: '·····';
  font-size: var(--theme-small, var(--default-theme-small));
  color: var(--theme-color-3, var(--default-theme-color-3));
}
</style>
