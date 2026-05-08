<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/scalar-markdown'
import { type TextUIPart } from 'ai'
import { type Ref } from 'vue'

const { messagePart } = defineProps<{
  messagePart: Ref<TextUIPart>
}>()
</script>

<template>
  <ScalarMarkdown :value="messagePart.value.text" />
</template>
