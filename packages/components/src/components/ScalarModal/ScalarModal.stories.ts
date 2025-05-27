import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarModal, { useModal } from './ScalarModal.vue'
import { ScalarSearchResultList, ScalarSearchResultItem } from '../ScalarSearchResults'
import { ScalarSearchInput } from '../ScalarSearchInput'

/**
 * Make sure to import the useModal hook from the ScalarModal component to open/close it
 */
const meta = {
  component: ScalarModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    size: {
      control: 'select',
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'full'],
    },
    variant: { control: 'select', options: ['history', 'search'] },
  },
} satisfies Meta<typeof ScalarModal>

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = {
  args: {} as any,
  render: (args) => ({
    components: { ScalarButton, ScalarModal },
    setup() {
      const modalState = useModal()
      modalState.show()
      return { args, modalState }
    },
    template: `
      <ScalarModal
        :state="modalState"
        title="Example modal"
        v-bind="args">
        <div class="flex flex-col gap-4">
          <div>You can put some nice content here, or even ask a nice question</div>
          <div class="flex *:flex-1 gap-2">
            <ScalarButton variant="outlined" @click="modalState.hide()" >Cancel</ScalarButton>
            <ScalarButton @click="modalState.hide()">Go ahead</ScalarButton>
          </div>
        </div>
      </ScalarModal>
      <div class="placeholder h-dvh flex-col gap-2">
        <div>Main page content</div>
        <ScalarButton size="sm" variant="outlined" @click="modalState.show()">
          Show modal
        </ScalarButton>
      </div>
    `,
  }),
}

export const Search: Story = {
  args: { variant: 'search' } as any,
  render: (args) => ({
    components: { ScalarButton, ScalarModal, ScalarSearchInput, ScalarSearchResultList, ScalarSearchResultItem },
    setup() {
      const modalState = useModal()
      const results = Array.from({ length: 10 }, (_, i) => ({
        title: `Result ${i + 1}`,
        description: `This is a description for result ${i + 1}`,
        addon: 'Addon',
      }))
      modalState.show()
      return { args, modalState, results }
    },
    template: `
      <ScalarModal
        :state="modalState"
        v-bind="args">
        <div class="flex flex-col min-h-0">
          <div class="p-3 pb-0">
            <ScalarSearchInput />
          </div>
          <div class="custom-scroll p-3 min-h-0 flex-1">
            <ScalarSearchResultList>
              <ScalarSearchResultItem
                v-for="result in results"
                :key="result.title"
                icon="Search"
                href="#">
                {{ result.title }}
                <template #description>{{ result.description }}</template>
                <template #addon>{{ result.addon }}</template>
              </ScalarSearchResultItem>
            </ScalarSearchResultList>
          </div>
        </div>
      </ScalarModal>
      <div class="placeholder h-dvh flex-col gap-2">
        <div>Main page content</div>
        <ScalarButton size="sm" variant="outlined" @click="modalState.show()">
          Show modal
        </ScalarButton>
      </div>
    `,
  }),
}

export const Scrolling: Story = {
  args: {
    bodyClass: 'custom-scroll border-t mt-3',
  } as any,
  render: (args) => ({
    components: { ScalarButton, ScalarModal },
    setup() {
      const modalState = useModal()
      modalState.show()
      return { args, modalState }
    },
    template: `
      <ScalarModal
        :state="modalState"
        title="Example modal"
        v-bind="args">
        <div class="custom-scroll max-h-[inherit] markdown">
<h1>HTML Ipsum Presents</h1>

				<p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p>

				<h2>Header Level 2</h2>

				<ol>
				   <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
				   <li>Aliquam tincidunt mauris eu risus.</li>
				</ol>

				<blockquote><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna. Cras in mi at felis aliquet congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis, tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.</p></blockquote>

				<h3>Header Level 3</h3>

				<ul>
				   <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
				   <li>Aliquam tincidunt mauris eu risus.</li>
				</ul>

<pre><code>#header h1 a {
  display: block;
  width: 300px;
  height: 80px;
}</code></pre>
        </div>
      </ScalarModal>
      <div class="placeholder h-dvh flex-col gap-2">
        <div>Main page content</div>
        <ScalarButton size="sm" variant="outlined" @click="modalState.show()">
          Show modal
        </ScalarButton>
      </div>
    `,
  }),
}
