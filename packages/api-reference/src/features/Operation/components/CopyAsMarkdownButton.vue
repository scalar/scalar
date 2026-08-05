<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconBrain } from '@scalar/icons'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { useLocalization } from '@/features/localization'
import { operationToMarkdown } from '@/features/Operation/helpers/operation-to-markdown'

const { method, path, operation } = defineProps<{
  method: string
  path: string
  operation: OperationObject
}>()

const { copyToClipboard } = useClipboard()
const { translate } = useLocalization()

const handleCopy = () =>
  copyToClipboard(operationToMarkdown({ method, path, operation }))
</script>
<template>
  <ScalarIconButton
    class="endpoint-copy-markdown p-0.5"
    :icon="ScalarIconBrain"
    :label="translate('actions.copyAsMarkdownForLlm')"
    size="xs"
    variant="ghost"
    @click.stop="handleCopy" />
</template>
