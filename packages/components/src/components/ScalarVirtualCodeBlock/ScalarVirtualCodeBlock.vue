<script lang="ts">
/**
 * Scalar Virtual Code Block component
 *
 * Renders large blocks of code using virtualized scrolling with a copy button.
 * Used as a fallback for ScalarCodeBlock when content exceeds the performance
 * threshold for syntax highlighting.
 *
 * @example
 * <ScalarVirtualCodeBlock content="large json string" lang="json" />
 */
export default {}
</script>
<script lang="ts" setup>
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarCodeBlockCopy from '../ScalarCodeBlock/ScalarCodeBlockCopy.vue'
import type { StandardLanguageKey } from '../ScalarCodeBlock/types'
import ScalarCopyBackdrop from '../ScalarCopy/ScalarCopyBackdrop.vue'
import ScalarVirtualText from '../ScalarVirtualText/ScalarVirtualText.vue'

const {
  content,
  lang = 'plaintext',
  copy = 'hover',
  lineHeight = 20,
} = defineProps<{
  /** Text content to display */
  content: string
  /** Language label for the copy button */
  lang?: StandardLanguageKey | string
  /** Copy button visibility: 'always', 'hover', or false */
  copy?: 'always' | 'hover' | false
  /** Height of each line in pixels */
  lineHeight?: number
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div
    v-bind="
      cx(
        'scalar-code-block group/code-block flex flex-col',
        'relative bg-b-1 min-h-0 min-w-0',
      )
    ">
    <ScalarVirtualText
      containerClass="custom-scroll overflow-auto flex flex-1 max-h-screen"
      contentClass="language-plaintext whitespace-pre font-code text-base p-2"
      :lineHeight="lineHeight"
      :text="content" />
    <ScalarCodeBlockCopy
      v-if="copy"
      class="scalar-code-copy absolute top-2.5 right-2.5"
      :class="[{ 'opacity-100': copy === 'always' }]"
      :content="content"
      :showLang="true"
      :lang="lang">
      <template #backdrop>
        <ScalarCopyBackdrop
          class="scalar-code-copy-backdrop -right-1.5 -top-1" />
      </template>
    </ScalarCodeBlockCopy>
  </div>
</template>
