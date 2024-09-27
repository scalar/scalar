<script lang="ts" setup>
import { type RouterHistory, RouterLink, RouterView } from 'vue-router'

import Placeholder from '../components/Placeholder.vue'
import RegisterRouter from './components/RegisterRouter.vue'
import Bar from './views/Bar.vue'
import Foo from './views/Foo.vue'

withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    history?: RouterHistory
  }>(),
  {
    pages: 'single',
  },
)
</script>
<template>
  <RegisterRouter
    :history="history"
    :pages="pages">
    <div class="scalar-app">
      <div
        class="flex gap-4 p-3"
        style="min-height: 100vh; align-items: stretch">
        <!-- Sidebar -->
        <Placeholder
          class="flex-shrink-0"
          style="width: 300px">
          <ul
            class="flex flex-col gap-2 p-4"
            style="position: sticky; top: 20px">
            <li>
              <RouterLink :to="{ name: 'foo' }">Foo</RouterLink>
            </li>
            <li>
              <RouterLink :to="{ name: 'bar' }">Bar</RouterLink>
            </li>
          </ul>
        </Placeholder>
        <!-- Content -->
        <Placeholder class="flex-grow w-full">
          <template v-if="pages === 'single'">
            <Foo id="foo" />
            <Bar id="bar" />
          </template>
          <template v-else>
            <RouterView />
          </template>
        </Placeholder>
      </div>
    </div>
  </RegisterRouter>
</template>
