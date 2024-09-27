<script lang="ts" setup>
import { type RouterHistory, RouterLink, RouterView } from 'vue-router'

import Placeholder from '../components/Placeholder.vue'
import Section from './components/Section.vue'
import { ROUTE_NAMES } from './routes'
import { registerRouter } from './utils/registerRouter'
import Bar from './views/Bar.vue'
import Introduction from './views/Introduction.vue'
import Operation from './views/Operation.vue'

const props = withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    history?: RouterHistory
  }>(),
  {
    pages: 'multi',
  },
)

registerRouter({
  pages: props.pages,
  history: props.history,
})

const operations = [
  {
    path: '/foobar',
    method: 'GET',
  },
  {
    path: '/foobar',
    method: 'POST',
  },
]
</script>
<template>
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
            <RouterLink :to="{ name: ROUTE_NAMES.INTRODUCTION }">
              Introduction
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: ROUTE_NAMES.BAR }">Bar</RouterLink>
          </li>
          <li
            v-for="({ method, path }, index) in operations"
            :key="index">
            <RouterLink
              :to="{
                name: ROUTE_NAMES.OPERATION,
                params: {
                  method,
                  path,
                },
              }">
              {{ method }} {{ path }}
            </RouterLink>
          </li>
          <li>
            path: <br />
            {{ $router.currentRoute.value.path }}
          </li>
          <li>
            params: <br />
            {{ $router.currentRoute.value.params }}
          </li>
        </ul>
      </Placeholder>
      <!-- Content -->
      <Placeholder class="flex-grow w-full">
        <template v-if="pages === 'single'">
          <Section
            :route="{
              name: ROUTE_NAMES.INTRODUCTION,
            }">
            <Introduction />
          </Section>
          <Section
            :route="{
              name: ROUTE_NAMES.BAR,
            }">
            <Bar />
          </Section>
          <!-- Operations -->
          <template
            v-for="({ method, path }, index) in operations"
            :key="index">
            <Section
              :route="{
                name: ROUTE_NAMES.OPERATION,
                params: {
                  method,
                  path,
                },
              }">
              <Operation
                :params="{
                  method,
                  path,
                }" />
            </Section>
          </template>
        </template>
        <template v-else>
          <RouterView />
        </template>
      </Placeholder>
    </div>
  </div>
</template>
