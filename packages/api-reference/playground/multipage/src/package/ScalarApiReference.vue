<script lang="ts" setup>
import { computed } from 'vue'

// import { type RouterHistory, RouterLink, RouterView } from 'vue-router'
import Placeholder from '../components/Placeholder.vue'
import Section from './components/Section.vue'
import { ROUTE_NAMES } from './routes'
// import { registerRouter } from './utils/registerRouter'
import Bar from './views/Bar.vue'
import Introduction from './views/Introduction.vue'
import Operation from './views/Operation.vue'
import Tag from './views/Tag.vue'

const props = withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    // history?: RouterHistory
  }>(),
  {
    pages: 'multi',
  },
)

// registerRouter({
//   pages: props.pages,
//   history: props.history,
// })

const tags = [
  {
    name: 'Authentication',
  },
  {
    name: 'Planets',
  },
]

const operations = [
  {
    path: '/foobar',
    method: 'GET',
    tags: ['Authentication'],
  },
  {
    path: '/foobar',
    method: 'POST',
    tags: ['Planets'],
  },
]

const items = computed(() => {
  const tagItems = tags.map((tag) => ({
    label: tag.name,
    to: { name: ROUTE_NAMES.TAG, params: { tag: tag.name } },
    children: operations
      .filter((op) => op.tags.includes(tag.name))
      .map((op) => ({
        label: `${op.method} ${op.path}`,
        to: {
          name: ROUTE_NAMES.OPERATION,
          params: {
            tag: tag.name.toLowerCase(),
            method: op.method,
            path: op.path,
          },
        },
      })),
  }))

  return [
    {
      label: 'Introduction',
      to: { name: ROUTE_NAMES.INTRODUCTION },
    },
    ...tagItems,
  ]
})
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
          <template
            v-for="(item, index) in items"
            :key="index">
            <li>
              <RouterLink :to="item.to">
                {{ item.label }}
              </RouterLink>
              <ul
                v-if="'children' in item && item.children.length"
                class="mt-2">
                <li
                  v-for="(child, childIndex) in item.children"
                  :key="childIndex">
                  > <RouterLink :to="child.to">{{ child.label }} </RouterLink>
                </li>
              </ul>
              <br />
            </li>
          </template>
        </ul>
        <ul class="border p-3 mt-2">
          <li class="py-1">
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
          <!-- Tags -->
          <template
            v-for="({ name }, index) in tags"
            :key="index">
            <Section
              :route="{
                name: ROUTE_NAMES.TAG,
                params: {
                  tag: name,
                },
              }">
              <Tag
                :params="{
                  tag: name,
                }" />
            </Section>
          </template>

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
