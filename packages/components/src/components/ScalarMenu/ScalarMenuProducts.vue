<script setup lang="ts">
import {
  ScalarIconArrowUpRight,
  ScalarIconBook,
  ScalarIconHouse,
  ScalarIconNotepad,
} from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarMenuProduct from './ScalarMenuProduct.vue'

type Product = 'dashboard' | 'docs' | 'editor' | 'client'

defineProps<{
  selected?: Product
  showDocs?: boolean
  hrefs?: Record<Product, string>
}>()

defineEmits<{
  (e: 'open', event: Event, product: Product): void
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex flex-col')">
    <ScalarMenuProduct
      :href="hrefs?.dashboard ?? 'https://dashboard.scalar.com'"
      :icon="ScalarIconHouse"
      :selected="selected === 'dashboard'"
      @click="$emit('open', $event, 'dashboard')">
      Dashboard
    </ScalarMenuProduct>
    <ScalarMenuProduct
      v-if="showDocs || selected === 'docs'"
      :href="hrefs?.docs ?? 'https://docs.scalar.com'"
      :icon="ScalarIconBook"
      :selected="selected === 'docs'"
      @click="$emit('open', $event, 'docs')">
      Docs
    </ScalarMenuProduct>
    <ScalarMenuProduct
      :href="hrefs?.editor ?? 'https://editor.scalar.com'"
      :icon="ScalarIconNotepad"
      :selected="selected === 'editor'"
      @click="$emit('open', $event, 'editor')">
      Editor
    </ScalarMenuProduct>
    <ScalarMenuProduct
      :href="hrefs?.client ?? 'https://client.scalar.com'"
      :icon="ScalarIconArrowUpRight"
      :selected="selected === 'client'"
      @click="$emit('open', $event, 'client')">
      Client
    </ScalarMenuProduct>
  </div>
</template>
