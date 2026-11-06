<script setup lang="ts">
import type { Node } from '@scalar/code-highlight'
import { ScalarCodeBlock } from '@scalar/components/code-block'
import {
  MARKDOWN_RENDER_HOOKS,
  ScalarMarkdown,
} from '@scalar/components/markdown'
import type { MarkdownRenderHook } from '@scalar/helpers/markdown/markdown-render-hook'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { inject, provide, ref, shallowRef, useId, watch } from 'vue'

import {
  resolveSdkMarkdown,
  type SdkCredentialCodeBlock,
} from '../helpers/resolve-sdk-markdown'

const { value, securitySchemes } = defineProps<{
  value: string
  securitySchemes: SecuritySchemeObjectSecret[]
}>()

const markerPrefix = `sdk-credentials-${useId()}`
const revision = ref(0)
const renderState: { blocks: SdkCredentialCodeBlock[] } = { blocks: [] }
const targets = shallowRef<
  { element: HTMLElement; block: SdkCredentialCodeBlock }[]
>([])

// A changed token can produce identical masked HTML. Remount so the copy value and
// enhancement targets still follow the latest credentials or authentication selection.
watch(
  [() => value, () => securitySchemes],
  () => {
    revision.value += 1
  },
  { deep: true },
)

const transform = (root: Node): Node => {
  renderState.blocks = resolveSdkMarkdown(root, securitySchemes, markerPrefix)
  return root
}

const renderCredentialBlocks: MarkdownRenderHook = ({ element }) => {
  targets.value = renderState.blocks.flatMap((block) => {
    const target = element.getElementsByClassName(block.marker)[0]
    if (!(target instanceof HTMLElement)) {
      return []
    }
    target.replaceChildren()
    return [{ element: target, block }]
  })
  return () => {
    targets.value = []
  }
}

provide(MARKDOWN_RENDER_HOOKS, [
  ...inject(MARKDOWN_RENDER_HOOKS, []),
  renderCredentialBlocks,
])
</script>
<template>
  <ScalarMarkdown
    :key="revision"
    :transform
    transformType="root"
    :value />
  <Teleport
    v-for="target in targets"
    :key="target.block.marker"
    :to="target.element">
    <ScalarCodeBlock
      :content="target.block.displayContent"
      :copyContent="target.block.copyContent"
      :lang="target.block.language"
      :lineNumbers="false" />
  </Teleport>
</template>
