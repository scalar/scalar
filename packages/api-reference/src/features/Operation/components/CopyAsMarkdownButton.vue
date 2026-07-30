<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconBrain } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { operationToMarkdown } from '@/features/Operation/helpers/operation-to-markdown'

const { method, path, operation } = defineProps<{
  method: string
  path: string
  operation: OperationObject
}>()

const { copyToClipboard } = useClipboard()

const handleCopy = () =>
  copyToClipboard(operationToMarkdown({ method, path, operation }))
</script>
<template>
  <ScalarIconButton
    class="endpoint-copy-markdown p-0.5"
    :icon="ScalarIconBrain"
    label="Copy as Markdown for LLM"
    size="xs"
    variant="ghost"
    @click.stop="handleCopy" />
</template>
