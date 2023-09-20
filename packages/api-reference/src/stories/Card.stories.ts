import '@scalar/default-theme/theme.css'
import type { Meta, StoryObj } from '@storybook/vue3'

import { Card, CardContent, CardHeader } from '../components/Card'

const meta: Meta<typeof Card> = {
  title: 'Example/Card',
  component: Card,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Card>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/vue/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: (args, { argTypes }) => ({
    components: {
      Card,
      CardHeader,
      CardContent,
    },
    props: Object.keys(argTypes),
    template: `
      <div class="light-mode">
        <Card v-bind="$props">
          <CardHeader>
            Test
          </CardHeader>
          <CardContent>
            Example Content
          </CardContent>
        </Card>
      </div>
    `,
  }),
  args: {},
}
