import { CalendarDate } from '@internationalized/date'
import { mount } from '@vue/test-utils'
import { CalendarRoot } from 'radix-vue'
import { describe, expect, it, vi } from 'vitest'

import DatePicker from './DatePicker.vue'

describe('DatePicker', () => {
  it('uses the selected date local offset when an empty field crosses daylight-saving seasons', async () => {
    vi.setSystemTime(new Date(2026, 8, 15, 13, 45, 30))
    const offset = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(function (this: Date) {
      return this.getMonth() === 0 ? -60 : -120
    })
    const wrapper = mount(DatePicker, { props: { modelValue: '', type: 'date-time' } })
    try {
      await wrapper.get('button').trigger('click')
      wrapper.getComponent(CalendarRoot).vm.$emit('update:modelValue', new CalendarDate(2027, 1, 15))
      expect(wrapper.emitted('update:modelValue')).toStrictEqual([['2027-01-15T13:45:30+01:00']])
    } finally {
      wrapper.unmount()
      offset.mockRestore()
      vi.useRealTimers()
    }
  })
})
