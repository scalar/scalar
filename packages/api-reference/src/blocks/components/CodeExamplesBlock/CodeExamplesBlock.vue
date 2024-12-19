<script lang="ts" setup>
/**
 * This component is exposed for everyone.
 * It should do the data wrangling and compose other components.
 * It should not have markup or CSS.
 */
import ThemeStyles from '@/blocks/components/ThemeStyles.vue'
import { type BlockProps, useBlockProps } from '@/blocks/hooks/useBlockProps'
import OperationPath from '@/components/OperationPath.vue'
import { ExampleRequest } from '@/features/ExampleRequest'
import { TestRequestButton } from '@/features/TestRequestButton'
import { computed } from 'vue'

const props = defineProps<BlockProps>()

const { operation, theme, serverUrl } = useBlockProps(props)

const request = computed(
  () =>
    new Request(`${serverUrl.value}${operation.value?.path}`, {
      method: operation.value?.method?.toUpperCase() ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }),
)
</script>

<template>
  <ThemeStyles :theme="theme" />
  <ExampleRequest
    v-if="operation"
    fallback
    :operation="operation"
    :request="request"
    :secretCredentials="[]">
    <template #header>
      <OperationPath
        :deprecated="operation.deprecated"
        :path="operation.path" />
    </template>
    <template #footer>
      <TestRequestButton :operation="operation" />
    </template>
  </ExampleRequest>
</template>
