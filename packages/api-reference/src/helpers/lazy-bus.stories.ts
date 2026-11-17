import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { onBeforeUnmount, ref, watch } from 'vue'

import MobileHeader from '../components/MobileHeader.vue'
import { firstLazyLoadComplete, requestLazyRender, scrollToElement, scrollToLazy } from './lazy-bus'

const meta: Meta = { title: 'Schema/LazyBus' }
export default meta

const story = (header: string, nested = false, margin = 0): StoryObj => ({
  render: () => ({
    components: { MobileHeader },
    setup: () => ({
      scroll: (): void => {
        const target = document.getElementById('scroll-target')
        if (target) {
          scrollToElement(target)
        }
      },
    }),
    template: `
      <div style="--scalar-header-height:50px">
        ${header}
        <button style="position:fixed;right:20px;bottom:20px;z-index:20" @click="scroll">Scroll to target</button>
        <main style="margin-left:200px;${nested ? 'position:fixed;top:60px;bottom:0;right:0;left:0;overflow:auto;' : ''}">
          <div style="height:1000px"></div>
          <h2 id="scroll-target" style="scroll-margin-top:${margin}px">Scroll target</h2>
          <div style="height:1200px"></div>
        </main>
      </div>
    `,
  }),
})

const header =
  '<header data-scalar-scroll-header style="position:fixed;top:0;left:0;right:0;height:60px;background:var(--scalar-background-2);z-index:10">Navigation</header>'

export const Sidebar = story('<aside style="position:fixed;top:0;left:0;width:180px;height:100vh">Sidebar</aside>')
export const StackedHeaders = story(
  `${header}<nav data-scalar-scroll-header style="position:fixed;top:60px;left:0;right:0;height:40px;background:var(--scalar-background-2);z-index:10">Tabs</nav>`,
)
export const StickyHeader = story(
  '<header data-scalar-scroll-header style="position:sticky;top:0;height:60px;background:var(--scalar-background-2);z-index:10">Sticky navigation</header>',
)
export const NestedContainer = story(header, true)
export const ExistingMargin = story(header, false, 100)

export const DecorativeBackground = story(
  `${header}<div class="section-flare" style="position:fixed;inset:0;pointer-events:none;background:linear-gradient(#7877c633,transparent)"><div style="position:fixed;inset:0;pointer-events:none"></div></div>`,
)

export const UnregisteredOverlay = story(
  `${header}<div style="position:fixed;inset:0;pointer-events:none;background:linear-gradient(#7877c633,transparent)"></div>`,
)

export const RegisteredMobileHeader = story(
  '<MobileHeader breadcrumb="Pets" :isSidebarOpen="false" :showSidebar="false" />',
)

/** A late height change models lazy content settling after its queue finishes. */
const lazyNavigationStory = (nested = false): StoryObj => ({
  render: () => ({
    setup: () => {
      const shifted = ref(false)
      let timer: ReturnType<typeof setTimeout> | undefined
      const shift = (): void => {
        timer = setTimeout(() => {
          shifted.value = true
        }, 80)
      }
      watch(firstLazyLoadComplete, shift, { once: true })
      onBeforeUnmount(() => clearTimeout(timer))
      return {
        shifted,
        scroll: (): void => {
          if (firstLazyLoadComplete.value) {
            shift()
          }
          scrollToLazy(
            'scroll-target',
            () => undefined,
            () => undefined,
          )
          requestLazyRender('scroll-target', true)
        },
      }
    },
    template: `
      <div :data-layout-shifted="shifted">
        <header data-scalar-scroll-header style="position:fixed;top:0;left:0;right:0;height:60px;background:var(--scalar-background-2);z-index:10">Navigation</header>
        <button style="position:fixed;right:20px;bottom:20px;z-index:20" @click="scroll">Scroll to target</button>
        <main style="${nested ? 'position:fixed;top:60px;bottom:0;left:0;right:0;overflow:auto;' : ''}">
          <div :style="{ height: shifted ? '3200px' : '2000px' }"></div>
          <h2 id="scroll-target" tabindex="-1" style="margin:0;scroll-margin-top:${nested ? 0 : 60}px">Scroll target</h2>
          <div style="height:3000px"></div>
        </main>
      </div>
    `,
  }),
})

export const LateLayout = lazyNavigationStory()
export const NestedLazyLayout = lazyNavigationStory(true)
