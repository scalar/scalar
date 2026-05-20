import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { ScalarFormInput, ScalarFormInputGroup } from '../ScalarForm'
import { ScalarLoading, useLoadingState } from './'

/**
 * To use the loading, you must pass in a loader which can be created using the useLoadingState hook exported from this component
 */
const meta = {
  component: ScalarLoading,
  tags: ['autodocs'],
  argTypes: {
    class: { control: 'text' },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
    },
    persist: {
      control: 'boolean',
    },
  },
  render: (args) => ({
    components: { ScalarFormInput, ScalarFormInputGroup, ScalarLoading },
    setup() {
      const loader = useLoadingState()
      loader.start()
      return { args, loader }
    },
    template: `
      <div class="flex border rounded divide-x w-fit">
        <div class="flex items-center justify-center p-4 min-w-40">
          <ScalarLoading
            v-if="loader.isActive"
            :loader="loader"
            v-bind="args" />
          <span v-else>Not loading</span>
        </div>
        <ScalarFormInputGroup class="*:text-xs border-none rounded-l-none">
          <ScalarFormInput
            @click="loader.start()">
            start
          </ScalarFormInput>
          <ScalarFormInput
            @click="loader.validate({ persist: args.persist })">
            validate
          </ScalarFormInput>
          <ScalarFormInput
            @click="loader.invalidate({ persist: args.persist })">
            invalidate
          </ScalarFormInput>
          <ScalarFormInput
            @click="loader.clear()">
            clear
          </ScalarFormInput>
        </ScalarFormInputGroup>
      </div>
    `,
  }),
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Base: Story = { args: { size: 'xl' } }

export const CustomClasses: Story = { args: { class: 'size-10 text-red' } }
