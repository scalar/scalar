import { getStarterTheme, themePresets } from '@scalar/themes'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import ScalarThemeSwatches from './ScalarThemeSwatches.vue'

const meta: Meta = {
  component: ScalarThemeSwatches,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    placeholder: { control: 'text' },
  },
  render: (args) => ({
    components: { ScalarThemeSwatches },
    setup() {
      const starter = getStarterTheme('Starter Theme')
      const themes = [...themePresets, starter]
      return { args, themes }
    },
    template: `
<div class="flex flex-wrap gap-4">
  <dl
    v-for="{ name, theme, slug } in themes"
    :key="slug"
    class="flex flex-col items-start gap-1">
    <dt>{{ name }}</dt>
    <dd><ScalarThemeSwatches :css="theme" /></dd>
  </dl>
</div>`,
  }),
}

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {}
