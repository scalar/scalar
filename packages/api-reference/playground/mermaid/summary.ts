import '@/style.css'

import { MARKDOWN_RENDER_HOOKS, ScalarMarkdownSummary } from '@scalar/components/markdown'
import { createApp, h, provide } from 'vue'

import { mermaidPlugin } from '../../../mermaid-plugin/src'

createApp({
  setup() {
    provide(MARKDOWN_RENDER_HOOKS, [mermaidPlugin()().markdown!])
    return () => h(ScalarMarkdownSummary, { value: 'Diagram summary.\n\n```mermaid\ngraph LR; A-->B\n```' })
  },
}).mount('#app')
