import type { Meta, StoryObj } from '@storybook/vue3'

import { MarkdownRenderer } from '../MarkdownRenderer'

const meta: Meta<typeof MarkdownRenderer> = {
  title: 'Example/MarkdownRenderer',
  component: MarkdownRenderer,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof MarkdownRenderer>

export const Default: Story = {
  render: (args) => ({
    components: {
      MarkdownRenderer,
    },
    setup() {
      return { args }
    },
    template: `
        <MarkdownRenderer v-bind="args">
          Example Content
        </MarkdownRenderer>
    `,
  }),
  args: {
    value: `# Example Content

This is an example paragraph. And this is a code block with syntax highlighting:

    const foo = 'bar'

## Heading 2

This is an example paragraph. And this is a block quote:

> This is a block quote.

And this is a bullet list:

* Item 1
* Item 2
* Item 3

And this is a numbered list:

1. Item 1
2. Item 2
3. Item 3

And this is a table:
| Foo | Bar|
| -- | -- |
| 1 | 2 |
| 3 | 4 |

And this is a link: [Example Link](https://example.com).

And images are removed: ![Example Image](https://via.placeholder.com/150)

But did you know, that you can use \`inline code\` too?`,
  },
}
