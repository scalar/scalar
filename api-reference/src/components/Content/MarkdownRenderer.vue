<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { toRef } from 'vue'

import { useMarkdown } from '@lib/hooks/useMarkdown'

import { getReferenceExtensions } from '@guide/RichTextExtensions/'

const props = defineProps<{ value: string }>()
const markdown = toRef(props, 'value')

const { editor } = useMarkdown(markdown, getReferenceExtensions())
</script>
<template>
  <EditorContent :editor="editor" />
</template>
