import { CalendarDate } from '@internationalized/date'
import { DOMWrapper, mount } from '@vue/test-utils'
import { CalendarRoot } from 'radix-vue'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { provideLocalization } from '@/v2/features/localization'

import DatePicker from './DatePicker.vue'

describe('DatePicker', () => {
  it('opens with localized labels and inserts a variable from the disclosure', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization(() => ({ locale: 'de-DE' }))
          return () => h(DatePicker, { fieldName: 'starts_at', modelValue: '{{startDate}}', type: 'date-time' })
        },
      }),
      { attachTo: document.body },
    )

    try {
      const trigger = wrapper.get('button[aria-label="Datum für starts_at auswählen"]')
      expect(trigger.attributes('aria-expanded')).toBe('false')
      await trigger.trigger('keydown', { key: 'Enter' })
      expect(trigger.attributes('aria-expanded')).toBe('true')

      const picker = wrapper.getComponent(DatePicker)
      expect(picker.emitted('update:modelValue')).toBeUndefined()
      const panel = new DOMWrapper(document.getElementById(trigger.attributes('aria-controls')!)!)
      expect(panel.get('[role="group"]').attributes('aria-label')).toBe('Datum für starts_at auswählen')
      expect(picker.getComponent(CalendarRoot).props('locale')).toBe('de-DE')
      expect(panel.get('[role="spinbutton"][aria-label="Stunde"]').attributes('aria-valuemin')).toBe('0')
      const previousMonth = panel.get('button[aria-label="Vorheriger Monat"]')
      const heading = picker.getComponent(CalendarRoot).text()
      await previousMonth.trigger('click')
      expect(picker.getComponent(CalendarRoot).text()).not.toBe(heading)

      const disclosure = panel.get('button[aria-expanded="false"]')
      expect(disclosure.text()).toBe('Variable einfügen')
      await disclosure.trigger('click')
      expect(disclosure.attributes('aria-expanded')).toBe('true')

      const timestamp = panel.findAll('button').find((button) => button.text() === 'Aktueller Zeitstempel')
      await timestamp?.trigger('click')
      expect(picker.emitted('update:modelValue')).toStrictEqual([['{{$isoTimestamp}}']])
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger.element)

      await trigger.trigger('keydown', { key: ' ' })
      expect(trigger.attributes('aria-expanded')).toBe('true')
      const nextPanel = new DOMWrapper(document.getElementById(trigger.attributes('aria-controls')!)!)
      await nextPanel.get('button[aria-label="Vorheriger Monat"]').trigger('keydown', { key: 'Escape' })
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger.element)
    } finally {
      wrapper.unmount()
    }
  })

  it('uses the selected date local offset when an empty field crosses daylight-saving seasons', async () => {
    vi.setSystemTime(new Date(2026, 8, 15, 13, 45, 30))
    const offset = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
      return this.getMonth() === 0 ? -60 : -120
    })
    const wrapper = mount(DatePicker, { props: { modelValue: '', type: 'date-time' } })
    try {
      await wrapper.get('button[aria-label="Pick a date"]').trigger('click')
      wrapper.getComponent(CalendarRoot).vm.$emit('update:modelValue', new CalendarDate(2027, 1, 15))
      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['2027-01-15T13:45:30+01:00']])
    } finally {
      wrapper.unmount()
      offset.mockRestore()
      vi.useRealTimers()
    }
  })
})
