import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { scrollToElement } from './lazy-bus'

const meta: Meta = { title: 'Schema/LazyBus' }
export default meta

const story = (header: string, nested = false, margin = 0): StoryObj => ({
  render: () => ({
    setup: () => ({
      scroll: (): void => {
        const target = document.getElementById('scroll-target')
        if (target) {
          scrollToElement(target)
        }
      },
    }),
    template: `
      <div>
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
  '<header data-header style="position:fixed;top:0;left:0;right:0;height:60px;background:var(--scalar-background-2);z-index:10">Navigation</header>'

export const Sidebar = story('<aside style="position:fixed;top:0;left:0;width:180px;height:100vh">Sidebar</aside>')
export const StackedHeaders = story(
  `${header}<nav data-header style="position:fixed;top:60px;left:0;right:0;height:40px;background:var(--scalar-background-2);z-index:10">Tabs</nav>`,
)
export const StickyHeader = story(
  '<header style="position:sticky;top:0;height:60px;background:var(--scalar-background-2);z-index:10">Sticky navigation</header>',
)
export const NestedContainer = story(header, true)
export const ExistingMargin = story(header, false, 100)
