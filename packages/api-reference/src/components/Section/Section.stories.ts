import type { Meta, StoryObj } from '@storybook/vue3'

import Section from './Section.vue'
import SectionColumn from './SectionColumn.vue'
import SectionColumns from './SectionColumns.vue'
import SectionContent from './SectionContent.vue'
import SectionHeader from './SectionHeader.vue'

const meta: Meta<typeof Section> = {
  title: 'Example/Section',
  component: Section,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof Section>

export const Default: Story = {
  render: (args) => ({
    components: {
      Section,
      SectionContent,
      SectionColumns,
      SectionColumn,
      SectionHeader,
    },
    setup() {
      return { args }
    },
    template: `
        <Section v-bind="args">
          <SectionContent>
            <SectionColumns>
              <SectionColumn>
                <SectionHeader>
                  Section 1
                </SectionHeader>
                Example Content
              </SectionColumn>
              <SectionColumn>
                Column 2
              </SectionColumn>
            </SectionColumns>
          </SectionContent>
        </Section>
        <Section v-bind="args">
          <SectionContent>
            <SectionColumns>
              <SectionColumn>
                <SectionHeader>
                  Section 2
                </SectionHeader>
                Example Content
              </SectionColumn>
              <SectionColumn>
                Column 2
              </SectionColumn>
            </SectionColumns>
          </SectionContent>
        </Section>
    `,
  }),
  args: {},
}
