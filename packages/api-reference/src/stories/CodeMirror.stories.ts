import { CodeMirror } from '@scalar/use-codemirror'
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta<typeof CodeMirror> = {
  title: 'Example/CodeMirror',
  component: CodeMirror,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof CodeMirror>

export const Default: Story = {
  render: (args) => ({
    components: {
      CodeMirror,
    },
    setup() {
      return { args }
    },
    template: `
        <CodeMirror v-bind="args" />
    `,
  }),
  args: {},
}

export const WithJavaScriptCode: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    languages: ['javascript'],
  },
}

export const WithJavaScriptCodeReadOnly: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    languages: ['javascript'],
    readOnly: true,
  },
}

export const WithLineNumbers: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    lineNumbers: true,
  },
}

export const DisableEnter: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    disableEnter: true,
  },
}

export const WithoutTheme: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    withoutTheme: true,
  },
}

export const WithVariables: Story = {
  ...Default,
  args: {
    content: `https://example.com/{foobar}`,
    withVariables: true,
  },
}

export const ForceDarkMode: Story = {
  ...Default,
  args: {
    content: `const foo = 'bar';`,
    forceDarkMode: true,
  },
}
