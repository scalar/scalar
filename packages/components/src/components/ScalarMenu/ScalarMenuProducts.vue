<script setup lang="ts">
import {
  ScalarIconArrowUpRight,
  ScalarIconBook,
  ScalarIconHouse,
} from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import ScalarMenuProduct from './ScalarMenuProduct.vue'

type Product = 'dashboard' | 'docs' | 'client'

defineProps<{
  selected?: Product
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
      :href="hrefs?.docs ?? 'https://docs.scalar.com'"
      :icon="ScalarIconBook"
      :selected="selected === 'docs'"
      @click="$emit('open', $event, 'docs')">
      Docs
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
