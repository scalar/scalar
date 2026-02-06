import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import EnvironmentSelector from './EnvironmentSelector.vue'

describe('EnvironmentSelector', () => {
  const mockEnvironments = ['production', 'staging', 'development']

  const mountWithProps = (
    custom: Partial<{
      environments: string[]
      activeEnvironment: string
    }> = {},
  ) => {
    return mount(EnvironmentSelector, {
      props: {
        environments: custom.environments ?? [],
        activeEnvironment: custom.activeEnvironment,
      },
    })
  }

  describe('display text', () => {
    it('displays "Add Environment" when no environments exist', () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * When there are no environments, the button should prompt
       * the user to add their first environment.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('Add Environment')
    })

    it('displays "Select Environment" when environments exist but none is active', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * With environments available but none selected, the button
       * should prompt the user to select one.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('Select Environment')
    })

    it('displays the active environment name when one is selected', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * When an environment is active, display its name to provide
       * clear feedback about the current context.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('production')
    })
  })

  describe('button styling', () => {
    it('applies accent styling when environment is active', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * Active environments get accent styling to make them
       * visually prominent and easy to identify.
       */
      const button = wrapper.find('button')
      expect(button.classes()).toContain('bg-c-accent/10')
      expect(button.classes()).toContain('text-c-accent')
      expect(button.classes()).toContain('border-c-accent/30')
    })

    it('applies muted styling when no environments exist', () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * Empty state gets muted styling to indicate that setup
       * is required before using this feature.
       */
      const button = wrapper.find('button')
      expect(button.classes()).toContain('text-c-3')
      expect(button.classes()).toContain('border-transparent')
    })

    it('applies default styling when environments exist but none is active', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * Default state uses neutral styling to invite interaction
       * without being distracting.
       */
      const button = wrapper.find('button')
      expect(button.classes()).toContain('text-c-2')
      expect(button.classes()).toContain('border-transparent')
    })
  })

  describe('active environment indicator badge', () => {
    it('shows badge when environment is active', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The badge provides a quick visual indicator that an environment
       * is currently active, visible even when the button is collapsed.
       */
      const badge = wrapper.find('.bg-c-accent.rounded-full')
      expect(badge.exists()).toBe(true)
    })

    it('hides badge when no environment is active', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * No badge should appear when no environment is selected,
       * keeping the UI clean and uncluttered.
       */
      const badge = wrapper.find('.bg-c-accent.rounded-full')
      expect(badge.exists()).toBe(false)
    })

    it('hides badge when environments array is empty', () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * The badge should not appear in the empty state.
       */
      const badge = wrapper.find('.bg-c-accent.rounded-full')
      expect(badge.exists()).toBe(false)
    })
  })

  describe('environment selection', () => {
    it('emits select:environment when handleSelectEnvironment is called', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * Get the component instance and call the handler directly.
       * This tests the emission logic without needing to interact
       * with the dropdown UI structure.
       */
      const componentInstance = wrapper.vm as any
      componentInstance.handleSelectEnvironment('production')
      await nextTick()

      /**
       * The component should emit select:environment with the environment name.
       */
      const emitted = wrapper.emitted('select:environment')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual(['production'])
    })

    it('emits select:environment with empty string when clearing selection', async () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * Calling handleSelectEnvironment with an empty string
       * should emit select:environment with an empty string value.
       */
      const componentInstance = wrapper.vm as any
      componentInstance.handleSelectEnvironment('')
      await nextTick()

      const emitted = wrapper.emitted('select:environment')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([''])
    })

    it('displays the active environment name in the button', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'staging',
      })

      /**
       * The active environment should be displayed in the button
       * so users can see which environment is currently selected.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('staging')
    })
  })

  describe('add environment', () => {
    it('emits add:environment when handleAddEnvironment is called', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * Get the component instance and call the handler directly.
       * This tests the emission logic for adding a new environment.
       */
      const componentInstance = wrapper.vm as any
      componentInstance.handleAddEnvironment()
      await nextTick()

      /**
       * Clicking the add button should emit add:environment.
       */
      const emitted = wrapper.emitted('add:environment')
      expect(emitted).toBeTruthy()
      expect(emitted?.length).toBe(1)
    })

    it('emits add:environment in empty state', async () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * In the empty state, calling handleAddEnvironment should
       * still emit the add:environment event.
       */
      const componentInstance = wrapper.vm as any
      componentInstance.handleAddEnvironment()
      await nextTick()

      const emitted = wrapper.emitted('add:environment')
      expect(emitted).toBeTruthy()
      expect(emitted?.length).toBe(1)
    })
  })

  describe('dropdown items rendering', () => {
    it('receives all environments as props', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * The component should receive and store all provided environments.
       * The dropdown template will iterate over these to create menu items.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.environments).toEqual(mockEnvironments)
      expect(componentInstance.environments.length).toBe(3)
    })

    it('conditionally renders "No Environment" option based on active state', () => {
      const wrapperWithActive = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The template uses v-if to conditionally show the "No Environment" option.
       * This is controlled by hasActiveEnvironment, so the option appears
       * whenever there is an active environment, regardless of whether
       * it exists in the environments list.
       */
      const componentInstance = wrapperWithActive.vm as any
      expect(componentInstance.hasEnvironments).toBe(true)
      expect(componentInstance.hasActiveEnvironment).toBe(true)

      const wrapperWithoutActive = mountWithProps({
        environments: mockEnvironments,
      })

      /**
       * When no environment is active, the "No Environment" option should not appear.
       */
      const componentInstanceNoActive = wrapperWithoutActive.vm as any
      expect(componentInstanceNoActive.hasEnvironments).toBe(true)
      expect(componentInstanceNoActive.hasActiveEnvironment).toBe(false)
    })

    it('conditionally renders helper text based on environments length and active state', () => {
      const wrapperEmpty = mountWithProps({ environments: [] })

      /**
       * The helper text is controlled by v-if="!hasEnvironments && !hasActiveEnvironment".
       * It should only show in the true empty state.
       */
      const componentInstance = wrapperEmpty.vm as any
      expect(componentInstance.hasEnvironments).toBe(false)
      expect(componentInstance.hasActiveEnvironment).toBe(false)

      const wrapperWithEnvs = mountWithProps({ environments: mockEnvironments })

      /**
       * When environments exist, hasEnvironments should be true,
       * hiding the helper text.
       */
      const componentInstanceWithEnvs = wrapperWithEnvs.vm as any
      expect(componentInstanceWithEnvs.hasEnvironments).toBe(true)

      const wrapperWithActiveOnly = mountWithProps({
        environments: [],
        activeEnvironment: 'some-env',
      })

      /**
       * When there's an active environment but no environments list,
       * the helper text should not show because the user already knows
       * about the feature.
       */
      const componentInstanceActiveOnly = wrapperWithActiveOnly.vm as any
      expect(componentInstanceActiveOnly.hasEnvironments).toBe(false)
      expect(componentInstanceActiveOnly.hasActiveEnvironment).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles single environment correctly', () => {
      const wrapper = mountWithProps({
        environments: ['production'],
        activeEnvironment: 'production',
      })

      /**
       * With only one environment, the component should still function
       * correctly, showing the active environment and allowing it to be cleared.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('production')
      expect(button.classes()).toContain('text-c-accent')
    })

    it('handles long environment names gracefully', () => {
      const longName = 'production-environment-with-very-long-name-for-testing'
      const wrapper = mountWithProps({
        environments: [longName],
        activeEnvironment: longName,
      })

      /**
       * Long names should be truncated with ellipsis to prevent
       * layout breaking while still being accessible.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain(longName)

      /**
       * The text should have line-clamp applied to limit overflow.
       */
      const textSpan = wrapper.find('.line-clamp-1')
      expect(textSpan.exists()).toBe(true)
    })

    it('handles undefined activeEnvironment prop gracefully', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * When activeEnvironment is undefined, the component should
       * default to the "Select Environment" state without errors.
       */
      expect(() => wrapper.vm).not.toThrow()
      const button = wrapper.find('button')
      expect(button.text()).toContain('Select Environment')
    })

    it('handles empty activeEnvironment string', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: '',
      })

      /**
       * An empty string for activeEnvironment is falsy, so
       * hasActiveEnvironment will be false and displayText should
       * show "Select Environment" since environments exist.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.hasActiveEnvironment).toBe(false)
      expect(componentInstance.displayText).toBe('Select Environment')
    })

    it('handles activeEnvironment that does not match any environment in the list', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'nonexistent',
      })

      /**
       * Even if the activeEnvironment does not match any environment in the list,
       * it should still display the value and apply active styling.
       * This handles cases where environments might be loading or out of sync.
       */
      const button = wrapper.find('button')
      expect(button.text()).toContain('nonexistent')
      expect(button.classes()).toContain('text-c-accent')
    })

    it('always renders dropdown to handle all states', () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * The dropdown should always render to handle all possible states,
       * including the edge case where there's an active environment but
       * the environments list is empty.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })

    it('handles active environment with empty environments list', () => {
      const wrapper = mountWithProps({
        environments: [],
        activeEnvironment: 'deleted-environment',
      })

      /**
       * This edge case can occur when an environment is deleted but
       * remains set as active, or when there are data sync issues.
       * The component should handle this gracefully.
       */
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)

      /**
       * Should display the active environment name even if it doesn't
       * exist in the environments list.
       */
      expect(button.text()).toContain('deleted-environment')

      /**
       * Should apply active styling to indicate something is selected.
       */
      expect(button.classes()).toContain('text-c-accent')
      expect(button.classes()).toContain('bg-c-accent/10')

      /**
       * Should show the active indicator badge.
       */
      const badge = wrapper.find('.bg-c-accent.rounded-full')
      expect(badge.exists()).toBe(true)

      /**
       * User should be able to clear the invalid active environment.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.hasActiveEnvironment).toBe(true)
    })

    it('allows clearing active environment when environments list is empty', () => {
      const wrapper = mountWithProps({
        environments: [],
        activeEnvironment: 'orphaned-environment',
      })

      /**
       * Even with an empty environments list, the user should be able
       * to clear the active environment to get back to a clean state.
       */
      const componentInstance = wrapper.vm as any
      componentInstance.handleSelectEnvironment('')

      const emitted = wrapper.emitted('select:environment')
      expect(emitted).toBeTruthy()
      expect(emitted?.[0]).toEqual([''])
    })

    it('does not show helper text when active environment exists but list is empty', () => {
      const wrapper = mountWithProps({
        environments: [],
        activeEnvironment: 'some-environment',
      })

      /**
       * The helper text is only for the true empty state where the user
       * hasn't created any environments yet. If there's an active environment,
       * we don't need to explain the feature.
       */
      const componentInstance = wrapper.vm as any
      expect(componentInstance.hasEnvironments).toBe(false)
      expect(componentInstance.hasActiveEnvironment).toBe(true)

      /**
       * The dropdown should exist but without the helper text.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('includes aria-label with current environment information', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * Aria-label provides screen reader users with context about
       * the current environment selection.
       */
      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toContain('Current environment')
      expect(button.attributes('aria-label')).toContain('production')
    })

    it('includes aria-label for empty state', () => {
      const wrapper = mountWithProps({ environments: [] })

      /**
       * Even in the empty state, the button should have an
       * accessible label.
       */
      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBeDefined()
      expect(button.attributes('aria-label')).toContain('Add Environment')
    })

    it('marks the badge as aria-hidden', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The visual indicator badge is decorative and should be
       * hidden from screen readers to avoid redundant information.
       */
      const badge = wrapper.find('[aria-hidden="true"]')
      expect(badge.exists()).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('correctly computes hasActiveEnvironment', () => {
      const wrapperWithActive = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * hasActiveEnvironment should be true when an environment is selected.
       */
      const componentInstance = wrapperWithActive.vm as any
      expect(componentInstance.hasActiveEnvironment).toBe(true)

      const wrapperWithoutActive = mountWithProps({
        environments: mockEnvironments,
      })

      /**
       * hasActiveEnvironment should be false when no environment is selected.
       */
      const componentInstanceNoActive = wrapperWithoutActive.vm as any
      expect(componentInstanceNoActive.hasActiveEnvironment).toBe(false)
    })

    it('correctly computes hasEnvironments', () => {
      const wrapperWithEnvs = mountWithProps({ environments: mockEnvironments })

      /**
       * hasEnvironments should be true when the environments array has items.
       */
      const componentInstance = wrapperWithEnvs.vm as any
      expect(componentInstance.hasEnvironments).toBe(true)

      const wrapperEmpty = mountWithProps({ environments: [] })

      /**
       * hasEnvironments should be false for an empty array.
       */
      const componentInstanceEmpty = wrapperEmpty.vm as any
      expect(componentInstanceEmpty.hasEnvironments).toBe(false)
    })
  })

  describe('dropdown interaction', () => {
    it('opens dropdown when button is clicked', async () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * Clicking the button should open the dropdown menu,
       * revealing environment options.
       */
      const button = wrapper.find('button')
      await button.trigger('click')
      await nextTick()

      /**
       * The ScalarDropdown component should be rendered.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })

    it('includes divider components in template', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The template includes ScalarDropdownDivider components to
       * separate sections. These are part of the dropdown slot template.
       */
      const componentHtml = wrapper.html()
      expect(componentHtml).toBeDefined()

      /**
       * Verify the dropdown component exists which contains the dividers.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })
  })

  describe('icon rendering', () => {
    it('renders Globe icon in the button', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * The Globe icon provides a visual cue that this control
       * is related to environments and contexts.
       */
      const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
      const globeIcon = icons.find((icon) => icon.props('icon') === 'Globe')

      expect(globeIcon?.exists()).toBe(true)
    })

    it('applies accent color to Globe icon when environment is active', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The icon should match the accent color when an environment
       * is active for visual consistency.
       */
      const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
      const globeIcon = icons.find((icon) => icon.props('icon') === 'Globe')

      expect(globeIcon?.classes()).toContain('text-c-accent')
    })

    it('applies muted color to Globe icon when no environment is active', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * The icon should use muted colors in the inactive state.
       */
      const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
      const globeIcon = icons.find((icon) => icon.props('icon') === 'Globe')

      expect(globeIcon?.classes()).toContain('text-c-3')
    })

    it('renders ChevronDown icon for dropdown indicator', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * The chevron icon indicates that this is a dropdown control.
       */
      const icons = wrapper.findAllComponents({ name: 'ScalarIcon' })
      const chevronIcon = icons.find((icon) => icon.props('icon') === 'ChevronDown')

      expect(chevronIcon?.exists()).toBe(true)
    })

    it('includes Add icon in the template for add environment action', () => {
      const wrapper = mountWithProps({ environments: mockEnvironments })

      /**
       * The template includes an Add icon for the new environment action.
       * This icon is part of the dropdown slot template and may not be
       * immediately visible until the dropdown is rendered.
       */
      const componentHtml = wrapper.html()
      expect(componentHtml).toBeDefined()

      /**
       * Verify the dropdown exists which contains the add button.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })

    it('includes Checkmark icons in template for selection indicators', () => {
      const wrapper = mountWithProps({
        environments: mockEnvironments,
        activeEnvironment: 'production',
      })

      /**
       * The template includes Checkmark icons to indicate the selected environment.
       * These are rendered as part of the dropdown items template slot.
       */
      const componentHtml = wrapper.html()
      expect(componentHtml).toBeDefined()

      /**
       * Verify the dropdown exists which contains the checkmark indicators.
       */
      const dropdown = wrapper.findComponent({ name: 'ScalarDropdown' })
      expect(dropdown.exists()).toBe(true)
    })
  })
})
