import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'

describe('OAuthScopesInput', () => {
  const baseFlow = {
    scopes: {
      'read:items': 'Read access to items',
      'write:items': 'Write access to items',
    },
  }

  const mountComponent = (opts?: { selected?: string[]; flow?: any }) => {
    return mount(OAuthScopesInput, {
      attachTo: document.body,
      props: {
        flow: opts?.flow ?? baseFlow,
        selectedScopes: opts?.selected ?? [],
        flowType: 'authorizationCode',
      },
    })
  }

  const openDisclosure = async (wrapper: ReturnType<typeof mountComponent>) => {
    const toggle = wrapper.find('button')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await nextTick()
  }

  it('renders scope label without dash when description is empty', async () => {
    const wrapper = mountComponent({
      flow: {
        scopes: {
          'read:items': 'Read access to items',
          'write:items': '',
        },
      },
    })
    await openDisclosure(wrapper)

    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(2)
    expect(rows[0]!.text()).toContain('read:items')
    expect(rows[0]!.text()).toContain('Read access to items')
    expect(rows[0]!.text()).toContain('–')
    expect(rows[1]!.text()).toContain('write:items')
    expect(rows[1]!.text()).not.toContain('–')
  })

  it('renders count and expands to show scopes', async () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Scopes Selected')
    expect(wrapper.text()).toContain('0 / 2')

    await openDisclosure(wrapper)
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('read:items')
    expect(wrapper.text()).toContain('Write access to items')
  })

  it('hides scope search when fewer than 10 scopes exist', async () => {
    const wrapper = mountComponent()
    await openDisclosure(wrapper)

    expect(wrapper.find('input[type="search"]').exists()).toBe(false)
  })

  it('shows scope search when at least 10 scopes exist', async () => {
    const scopes = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`scope:${i}`, `Description ${i}`]))
    const wrapper = mountComponent({ flow: { scopes } as any })
    await openDisclosure(wrapper)

    expect(wrapper.find('input[type="search"]').exists()).toBe(true)
  })

  it('selects and deselects a scope via row click', async () => {
    const wrapper = mountComponent()
    await openDisclosure(wrapper)

    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(2)

    // Select first scope
    await rows[0]!.trigger('click')
    const firstEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(firstEmit?.scopes).toEqual(['read:items'])

    // Simulate v-model by updating props
    await wrapper.setProps({ selectedScopes: firstEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('1 / 2')

    // Deselect first scope
    await rows[0]!.trigger('click')
    const secondEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(secondEmit?.scopes).toEqual([])

    await wrapper.setProps({ selectedScopes: secondEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('0 / 2')
  })

  it('Select All and Deselect All emit correct scopes', async () => {
    const wrapper = mountComponent()

    // Select All
    const selectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Select All')
    expect(selectAllBtn, 'Select All button should exist').toBeTruthy()
    await selectAllBtn!.trigger('click')

    const selectAllEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(selectAllEmit?.scopes.sort()).toEqual(['read:items', 'write:items'])

    await wrapper.setProps({ selectedScopes: selectAllEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('2 / 2')

    // Now Deselect All should be visible
    const deselectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Deselect All')
    expect(deselectAllBtn, 'Deselect All button should exist').toBeTruthy()
    await deselectAllBtn!.trigger('click')

    const deselectAllEmit = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(deselectAllEmit?.scopes).toEqual([])

    await wrapper.setProps({ selectedScopes: deselectAllEmit.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('0 / 2')
  })

  it('updates via checkbox change event', async () => {
    const wrapper = mountComponent()
    await openDisclosure(wrapper)

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(2)

    // Check first scope
    await checkboxes[0]!.setValue(true)
    const emit1 = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit1?.scopes).toEqual(['read:items'])
    await wrapper.setProps({ selectedScopes: emit1.scopes })
    await nextTick()
    expect(wrapper.text()).toContain('1 / 2')

    // Uncheck first scope
    await checkboxes[0]!.setValue(false)
    const emit2 = wrapper.emitted('update:selectedScopes')?.at(-1)?.[0] as any
    expect(emit2?.scopes).toEqual([])
  })

  it('emits delete:scope when the delete button is clicked and leaves selection cleanup to the store', async () => {
    const wrapper = mountComponent({ selected: ['read:items', 'write:items'] })
    await openDisclosure(wrapper)

    const deleteBtn = wrapper.findAll('button').find((b) => b.text() === 'Delete read:items')
    expect(deleteBtn, 'Delete button for read:items should exist').toBeTruthy()
    await deleteBtn!.trigger('click')

    expect(wrapper.emitted('delete:scope')?.at(-1)?.[0]).toEqual({
      scope: 'read:items',
      flowType: 'authorizationCode',
    })
    // Selection cleanup is owned by the deleteScope mutator, the component does not emit a
    // follow-up update:selectedScopes here.
    expect(wrapper.emitted('update:selectedScopes')).toBeUndefined()
  })

  it('emits upsert:scope with oldScope and leaves selection cleanup to the store', async () => {
    const wrapper = mountComponent({ selected: ['read:items'] })
    await openDisclosure(wrapper)

    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'Edit read:items')
    expect(editBtn, 'Edit button for read:items should exist').toBeTruthy()
    await editBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    expect(modal.exists()).toBe(true)

    modal.vm.$emit('submit', {
      name: 'read:stuff',
      description: 'Read everything',
      oldName: 'read:items',
    })
    await nextTick()

    expect(wrapper.emitted('upsert:scope')?.at(-1)?.[0]).toEqual({
      scope: 'read:stuff',
      description: 'Read everything',
      flowType: 'authorizationCode',
      oldScope: 'read:items',
    })
    // Selection rename is owned by the upsertScope mutator, the component does not emit a
    // follow-up update:selectedScopes here.
    expect(wrapper.emitted('update:selectedScopes')).toBeUndefined()
  })

  it('emits upsert:scope with enable when adding a new scope so the mutator auto-selects it', async () => {
    const wrapper = mountComponent({ selected: ['read:items'] })

    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add Scope')
    expect(addBtn, 'Add Scope button should exist').toBeTruthy()
    await addBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    modal.vm.$emit('submit', {
      name: 'delete:items',
      description: 'Delete items',
    })
    await nextTick()

    expect(wrapper.emitted('upsert:scope')?.at(-1)?.[0]).toEqual({
      scope: 'delete:items',
      description: 'Delete items',
      flowType: 'authorizationCode',
      enable: true,
    })
    // Selection is owned by the upsertScope mutator (driven by `enable: true`), the component
    // does not emit a follow-up update:selectedScopes here.
    expect(wrapper.emitted('update:selectedScopes')).toBeUndefined()
  })

  it('does not pass enable when editing an existing scope', async () => {
    const wrapper = mountComponent({ selected: ['read:items'] })
    await openDisclosure(wrapper)

    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'Edit read:items')
    expect(editBtn, 'Edit button for read:items should exist').toBeTruthy()
    await editBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    modal.vm.$emit('submit', {
      name: 'read:stuff',
      description: 'Read everything',
      oldName: 'read:items',
    })
    await nextTick()

    const payload = wrapper.emitted('upsert:scope')?.at(-1)?.[0] as Record<string, unknown>
    expect(payload).not.toHaveProperty('enable')
  })

  it('auto-expands the panel after adding the first scope from an empty flow', async () => {
    const wrapper = mountComponent({ flow: { scopes: {} } })
    expect(wrapper.findAll('tr').length).toBe(0)

    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add Scope')
    expect(addBtn, 'Add Scope button should exist').toBeTruthy()
    await addBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    modal.vm.$emit('submit', {
      name: 'first:scope',
      description: 'First scope',
    })
    await nextTick()

    await wrapper.setProps({
      flow: {
        scopes: { 'first:scope': 'First scope' },
      } as any,
    })
    await nextTick()

    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(1)
    expect(wrapper.text()).toContain('first:scope')
  })

  it('auto-expands the panel after adding a new scope so the user sees it', async () => {
    const wrapper = mountComponent()
    // Panel starts collapsed
    expect(wrapper.findAll('tr').length).toBe(0)

    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add Scope')
    expect(addBtn, 'Add Scope button should exist').toBeTruthy()
    await addBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    modal.vm.$emit('submit', {
      name: 'delete:items',
      description: 'Delete items',
    })
    await nextTick()

    // Simulate the parent applying the new scope to the flow, which is what the
    // upsertScope mutator does in production.
    await wrapper.setProps({
      flow: {
        scopes: {
          ...baseFlow.scopes,
          'delete:items': 'Delete items',
        },
      } as any,
    })
    await nextTick()

    // The panel should now be expanded, showing all three scopes including the new one
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(3)
    expect(wrapper.text()).toContain('delete:items')
  })

  it('does not auto-expand after editing an existing scope', async () => {
    const wrapper = mountComponent()
    // Panel starts collapsed
    expect(wrapper.findAll('tr').length).toBe(0)

    // Open the panel so we can find the edit button, then close it again to verify
    // that editing does not force the panel back open.
    await openDisclosure(wrapper)
    const editBtn = wrapper.findAll('button').find((b) => b.text() === 'Edit read:items')
    expect(editBtn, 'Edit button for read:items should exist').toBeTruthy()
    await editBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    modal.vm.$emit('submit', {
      name: 'read:stuff',
      description: 'Read everything',
      oldName: 'read:items',
    })
    await nextTick()

    // Apply the rename in the parent. Edits do not bump the disclosure remount key,
    // so the panel keeps whatever open/closed state the user already had.
    await wrapper.setProps({
      flow: {
        scopes: {
          'read:stuff': 'Read everything',
          'write:items': 'Write access to items',
        },
      } as any,
    })
    await nextTick()

    // Panel stays as the user left it (open in this case, because we explicitly opened it)
    expect(wrapper.findAll('tr').length).toBe(2)
  })

  it('collapses the panel when the last scope is deleted while expanded', async () => {
    const wrapper = mountComponent({
      selected: ['read:items'],
      flow: { scopes: { 'read:items': 'Read access to items' } },
    })

    // Open the panel and confirm the scope row is visible
    await openDisclosure(wrapper)
    expect(wrapper.findAll('tr').length).toBe(1)

    // Simulate the parent applying the delete: the flow ends up with no scopes
    await wrapper.setProps({ selectedScopes: [], flow: { scopes: {} } as any })
    await nextTick()

    // The empty-state copy is shown and the panel is no longer expanded
    expect(wrapper.text()).toContain('No Scopes Defined')
    expect(wrapper.findAll('tr').length).toBe(0)
  })

  it('handles empty scopes gracefully', async () => {
    const wrapper = mountComponent({ flow: { scopes: {} } })

    // Shows the empty-state copy instead of the scope count
    expect(wrapper.text()).toContain('No Scopes Defined')
    expect(wrapper.text()).not.toContain('Scopes Selected')

    // Neither Select All nor Deselect All should be rendered when there are no scopes
    const deselectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Deselect All')
    expect(deselectAllBtn, 'Deselect All button should not exist when there are no scopes').toBeFalsy()
    const selectAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Select All')
    expect(selectAllBtn, 'Select All button should not exist when there are no scopes').toBeFalsy()

    // The disclosure should not expand because the chevron toggle is hidden and the button is disabled
    await openDisclosure(wrapper)
    const rows = wrapper.findAll('tr')
    expect(rows.length).toBe(0)
    expect(wrapper.emitted('update:selectedScopes')).toBeUndefined()
  })

  it('opens the add-scope modal when Add Scope is clicked while the flow defines no scopes', async () => {
    const wrapper = mountComponent({ flow: { scopes: {} } })

    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add Scope')
    expect(addBtn, 'Add Scope button should exist').toBeTruthy()
    await addBtn!.trigger('click')
    await nextTick()

    const modal = wrapper.findComponent({ name: 'OAuthScopesAddModal' })
    expect(modal.props('state').open).toBe(true)
  })
})
