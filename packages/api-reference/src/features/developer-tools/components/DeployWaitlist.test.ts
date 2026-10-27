import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DeployWaitlist from './DeployWaitlist.vue'

enableAutoUnmount(afterEach)

const fetchMock = vi.fn()

/** The success state animates the loader, so the timers are run until the form settles */
const settle = async () => {
  await vi.runAllTimersAsync()
  await flushPromises()
}

const submitEmail = async (wrapper: ReturnType<typeof mount>, email: string) => {
  await wrapper.get('input[type="email"]').setValue(email)
  await wrapper.get('form').trigger('submit')
  await settle()
}

describe('DeployWaitlist', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('labels the email field and names the form after the card', () => {
    const wrapper = mount(DeployWaitlist)
    const input = wrapper.get('input[type="email"]')

    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Email')
    expect(input.attributes('required')).toBeDefined()
    const form = wrapper.get('form')
    expect(wrapper.get(`#${form.attributes('aria-labelledby')}`).text()).toBe('Deploy your API on Scalar')
  })

  it('signs up for the hosting waitlist and confirms it', async () => {
    fetchMock.mockResolvedValue(new Response('{"success":true}', { status: 200 }))
    const wrapper = mount(DeployWaitlist)

    await submitEmail(wrapper, 'dev@acme.io')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://app.loops.so/api/newsletter-form/clksm7aj203tclb0olg1z2xb3')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(init.body).toBe('userGroup=Hosting&mailingLists=&email=dev%40acme.io')
    expect(wrapper.get('[role="status"]').text()).toContain("Thanks! We'll be in touch!")
  })

  it('goes back to an empty form from the confirmation', async () => {
    fetchMock.mockResolvedValue(new Response('{"success":true}', { status: 200 }))
    const wrapper = mount(DeployWaitlist, { attachTo: document.body })
    await submitEmail(wrapper, 'dev@acme.io')

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Back'))!
      .trigger('click')
    await settle()

    const input = wrapper.get('input[type="email"]')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(input.element)
  })

  it('shows the message the form service returns', async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"Email is invalid"}', { status: 400 }))
    const wrapper = mount(DeployWaitlist)

    await submitEmail(wrapper, 'dev@acme.io')

    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toBe('Email is invalid')
    const input = wrapper.get('input[type="email"]')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(alert.attributes('id'))
  })

  it('allows one sign-up a minute, like the embedded form', async () => {
    fetchMock.mockResolvedValue(new Response('{"success":true}', { status: 200 }))
    const wrapper = mount(DeployWaitlist, { attachTo: document.body })
    await submitEmail(wrapper, 'dev@acme.io')
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Back'))!
      .trigger('click')
    await settle()

    await submitEmail(wrapper, 'again@acme.io')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="alert"]').text()).toBe('Too many signups, please try again in a little while')
  })

  it('closes from its close button', async () => {
    const onClose = vi.fn()
    const wrapper = mount(DeployWaitlist, { props: { onClose } })

    await wrapper.get('button[aria-label="Close"]').trigger('click')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  describe('framework', () => {
    it('offers to run a server framework app on Scalar, with what hosting includes', () => {
      const wrapper = mount(DeployWaitlist, { props: { integration: 'fastapi' } })

      expect(wrapper.get('h2').text()).toBe('Deploy your FastAPI app on Scalar')
      const rows = wrapper.get('ul[role="list"]').findAll(':scope > li')
      expect(rows.map((row) => row.find('.font-bold').text())).toEqual([
        'Starts with 1 vCPU · 0.5 GB',
        'Sleeps when idle, $0',
        'Deploys on every push',
        'Effectively infinite scale',
      ])
      const plans = wrapper.get('a[href="https://scalar.com/pricing"]')
      expect(plans.attributes('target')).toBe('_blank')
      expect(plans.text()).toContain('See plans')
    })

    it('uses the general API title for integrations that only render docs', () => {
      const wrapper = mount(DeployWaitlist, { props: { integration: 'docusaurus' } })

      expect(wrapper.get('h2').text()).toBe('Deploy your API on Scalar')
    })

    it('lists what hosting includes without a framework too', () => {
      const wrapper = mount(DeployWaitlist)

      expect(wrapper.get('h2').text()).toBe('Deploy your API on Scalar')
      expect(wrapper.get('ul[role="list"]').findAll(':scope > li')).toHaveLength(4)
      expect(wrapper.find('a[href="https://scalar.com/pricing"]').exists()).toBe(true)
    })
  })
})
