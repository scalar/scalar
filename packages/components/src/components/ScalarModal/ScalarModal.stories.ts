import type { Meta, StoryObj } from '@storybook/vue3'

import { ScalarButton } from '../ScalarButton'
import ScalarModal, { useModal } from './ScalarModal.vue'

/**
 * Make sure to import the useModal hook from the ScalarModal component to open/close it
 */
const meta = {
  component: ScalarModal,
  tags: ['autodocs'],
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
      return { args, modalState }
    },
    template: `
      <ScalarModal
        :state="modalState"
        title="Example modal"
        v-bind="args">
        <div class="col gap-4">
          <div>You can put some nice content here, or even ask a nice question</div>
          <div class="col md:row gap-2">
            <ScalarButton variant="outlined" @click="modalState.hide()" fullWidth>Cancel</ScalarButton>
            <ScalarButton @click="modalState.hide()" fullWidth>Go ahead</ScalarButton>
          </div>
        </div>
      </ScalarModal>
      <ScalarButton @click="modalState.show()">Click me</ScalarButton>
    `,
  }),
}

export const Scrolling: Story = {
  args: {} as any,
  render: (args) => ({
    components: { ScalarButton, ScalarModal },
    setup() {
      const modalState = useModal()
      return { args, modalState }
    },
    template: `
      <ScalarModal
        :state="modalState"
        title="Example modal"
        v-bind="args">
        <div class="markdown">
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
      <ScalarButton @click="modalState.show()">Click me</ScalarButton>
    `,
  }),
}
