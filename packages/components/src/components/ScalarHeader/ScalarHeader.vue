<script setup lang="ts">
import { useBindCx } from '../../hooks/useBindCx'

const { cx } = useBindCx()
</script>
<template>
  <header
    v-bind="
      cx(
        'flex min-h-header items-center justify-between gap-2 border-b px-2 text-sm',
        '*:flex-1 *:flex *:items-center',
      )
    ">
    <div class="justify-start"><slot name="start" /></div>
    <div class="justify-center"><slot /></div>
    <div class="justify-end"><slot name="end" /></div>
  </header>
</template>
