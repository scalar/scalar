import type { Meta, StoryObj } from '@storybook/vue3'

import { SimpleCell, SimpleHeader, SimpleRow, SimpleTable } from '.'

const meta: Meta<typeof SimpleTable> = {
  title: 'Example/SimpleTable',
  component: SimpleTable,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof SimpleTable>

export const Primary: Story = {
  render: () => ({
    components: {
      SimpleTable,
      SimpleRow,
      SimpleHeader,
      SimpleCell,
    },
    template: `
      <SimpleTable v-bind="$props">
        <SimpleRow>
          <SimpleHeader>
            Foo
          </SimpleHeader>
          <SimpleHeader>
            Bar
          </SimpleHeader>
        </SimpleRow>
        <SimpleRow>
          <SimpleCell>
            Foo
          </SimpleCell>
          <SimpleCell>
            Bar
          </SimpleCell>
        </SimpleRow>
      </SimpleTable>
    `,
  }),
}
