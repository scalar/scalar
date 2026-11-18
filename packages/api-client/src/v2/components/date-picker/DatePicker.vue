<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  CalendarDate,
  CalendarDateTime,
  type DateValue,
} from '@internationalized/date'
import { ScalarButton } from '@scalar/components/button'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarPopover } from '@scalar/components/popover'
import {
  ScalarIconCalendarBlank,
  ScalarIconCaretLeft,
  ScalarIconCaretRight,
  ScalarIconClock,
} from '@scalar/icons'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  DateFieldInput,
  DateFieldRoot,
} from 'radix-vue'
import { computed, ref, shallowRef, watch } from 'vue'

import { useLocalization } from '@/v2/features/localization'

import {
  formatValue,
  parseValue,
  partsFromDate,
  resolveLocalDateTime,
  type DateParts,
  type DatePickerType,
} from './date-parts'

const { modelValue, fieldName, type } = defineProps<{
  /** The current field value; may be a formatted value, free text, or a variable. */
  modelValue: string
  /** Field name used to distinguish picker triggers in the request table. */
  fieldName?: string
  /** Which OpenAPI string format this field carries. */
  type: DatePickerType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { direction, locale, translate } = useLocalization()

const pickerLabel = computed(() => {
  if (fieldName) {
    return translate(
      type === 'time'
        ? 'apiClient.datePicker.pickTimeFor'
        : 'apiClient.datePicker.pickDateFor',
      {
        name: fieldName,
      },
    )
  }
  return translate(
    type === 'time'
      ? 'apiClient.datePicker.pickTime'
      : 'apiClient.datePicker.pickDate',
  )
})

/** Intl requires a BCP 47 locale, while client configuration also accepts aliases such as pt_BR. */
const calendarLocale = computed(() => {
  try {
    return (
      Intl.getCanonicalLocales(locale.value.replaceAll('_', '-'))[0] ?? 'en'
    )
  } catch {
    return 'en'
  }
})

/** Whether the calendar grid is shown (everything except the time-only picker). */
const showCalendar = computed(() => type !== 'time')

/** Whether the time controls are shown. */
const showTime = computed(() => type !== 'date')

const timeSegmentLabels = computed<Record<string, string>>(() => ({
  hour: translate('apiClient.datePicker.hour'),
  minute: translate('apiClient.datePicker.minute'),
  second: translate('apiClient.datePicker.second'),
}))

/**
 * The currently committed selection parsed from `modelValue`, or `null` when
 * the field holds free text or a variable. Drives both the highlighted day and
 * the time input, and lets us leave the field untouched until the user picks.
 */
const selection = computed<DateParts | null>(() => parseValue(modelValue, type))

/**
 * Working fields. Seeded from the current value when it is a valid date/time,
 * otherwise from "now" so the calendar opens on a sensible month.
 */
const draft = ref<DateParts>(selection.value ?? partsFromDate(new Date()))

/** The month the calendar shows before a date is chosen. */
// Calendar values are immutable class instances; keep their private fields intact.
const placeholder = shallowRef<DateValue>(
  new CalendarDate(draft.value.year, draft.value.month, draft.value.day),
)

/** Keep the working fields and calendar view in sync with the field. */
watch(
  () => modelValue,
  () => {
    draft.value = selection.value ?? partsFromDate(new Date())
    placeholder.value = new CalendarDate(
      draft.value.year,
      draft.value.month,
      draft.value.day,
    )
  },
)

/** The selected day as a calendar value, or `undefined` when nothing is selected. */
const calendarValue = computed<DateValue | undefined>(() =>
  selection.value
    ? new CalendarDate(
        selection.value.year,
        selection.value.month,
        selection.value.day,
      )
    : undefined,
)

/**
 * The time bound to the segmented time field. radix-vue has no standalone time
 * field in this version, so we back it with a `CalendarDateTime` and only render
 * its hour/minute/second segments; the date part is ignored. A writable computed
 * (rather than a one-way `:modelValue`) is what keeps the segments prefilled with
 * the current time — DateField only populates from `modelValue` via `v-model`.
 */
const timeModel = computed<DateValue | undefined>({
  get: () =>
    new CalendarDateTime(
      draft.value.year || 2000,
      draft.value.month || 1,
      draft.value.day || 1,
      draft.value.hour,
      draft.value.minute,
      draft.value.second,
    ),
  set: (value) => {
    // Only `CalendarDateTime`/`ZonedDateTime` carry time parts; ignore bare dates.
    if (!value || !('hour' in value)) {
      return
    }
    commit({
      ...draft.value,
      hour: value.hour,
      minute: value.minute,
      second: value.second,
    })
  },
})

/** The faker variables offered as shortcuts, contextual to the format. */
const fakerOptions = computed<{ name: string; label: string }[]>(() =>
  type === 'date-time'
    ? [
        {
          name: '$isoTimestamp',
          label: translate('apiClient.datePicker.currentTimestamp'),
        },
        {
          name: '$randomDateFuture',
          label: translate('apiClient.datePicker.randomFutureDate'),
        },
        {
          name: '$randomDatePast',
          label: translate('apiClient.datePicker.randomPastDate'),
        },
        {
          name: '$randomDateRecent',
          label: translate('apiClient.datePicker.randomRecentDate'),
        },
      ]
    : [],
)

/** Emit a value built from the working fields, filling a local offset for `date-time`. */
const commit = (next: DateParts): void => {
  const resolved =
    type === 'date-time' && !next.offset ? resolveLocalDateTime(next) : next
  draft.value = resolved
  emit('update:modelValue', formatValue(resolved, type))
}

const handleCalendarSelect = (
  value: DateValue | undefined,
  close: () => void,
): void => {
  if (!value) {
    return
  }
  commit({
    ...draft.value,
    year: value.year,
    month: value.month,
    day: value.day,
    // Unzoned input uses the selected date's local offset, which can differ across seasons.
    offset: selection.value?.offset ?? '',
  })
  // A date has nothing left to pick, so close; date-time keeps the time controls open.
  if (type === 'date') {
    close()
  }
}

/** Seed the picker with the current date/time. */
const selectNow = (close: () => void): void => {
  commit(partsFromDate(new Date()))
  if (type === 'date') {
    close()
  }
}

/** Insert a faker variable so the value is generated fresh at send time. */
const selectFaker = (name: string, close: () => void): void => {
  emit('update:modelValue', `{{${name}}}`)
  close()
}

/**
 * Keep only the time-related segments (hour/minute/second and the `:` literals
 * between them). The backing value is a `CalendarDateTime`, so radix also yields
 * date segments we do not want to show — we slice from the first time part. The
 * generic preserves radix's `SegmentPart` type so it stays assignable to `part`.
 */
const timeSegments = <T extends { part: string }>(segments: T[]): T[] => {
  const start = segments.findIndex((segment) => segment.part === 'hour')
  return start === -1 ? segments : segments.slice(start)
}
</script>

<template>
  <ScalarPopover
    focus
    placement="bottom-end"
    teleport>
    <ScalarIconButton
      :aria-label="pickerLabel"
      class="-mr-0.5"
      :icon="type === 'time' ? ScalarIconClock : ScalarIconCalendarBlank"
      :label="pickerLabel"
      size="xs"
      tooltip="top"
      variant="ghost" />
    <template #popover="{ close }">
      <div
        :aria-label="pickerLabel"
        class="flex w-64 flex-col gap-3 py-2"
        :dir="direction"
        role="group">
        <!-- Calendar (accessible grid from radix-vue) -->
        <CalendarRoot
          v-if="showCalendar"
          v-slot="{ weekDays, grid }"
          :calendarLabel="translate('apiClient.datePicker.calendar')"
          class="px-2"
          :dir="direction"
          :locale="calendarLocale"
          :modelValue="calendarValue"
          :placeholder="placeholder"
          @update:modelValue="(v) => handleCalendarSelect(v, close)"
          @update:placeholder="(v) => (placeholder = v)">
          <CalendarHeader class="mb-2 flex items-center justify-between">
            <CalendarPrev
              :aria-label="translate('apiClient.datePicker.previousMonth')"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 flex size-7 items-center justify-center rounded">
              <ScalarIconCaretLeft class="size-4 rtl:rotate-180" />
            </CalendarPrev>
            <CalendarHeading class="text-c-1 text-sm font-medium" />
            <CalendarNext
              :aria-label="translate('apiClient.datePicker.nextMonth')"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 flex size-7 items-center justify-center rounded">
              <ScalarIconCaretRight class="size-4 rtl:rotate-180" />
            </CalendarNext>
          </CalendarHeader>
          <CalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse">
            <CalendarGridHead>
              <CalendarGridRow class="grid grid-cols-7">
                <CalendarHeadCell
                  v-for="(day, index) in weekDays"
                  :key="index"
                  class="text-c-3 flex h-6 items-center justify-center text-xs font-normal">
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              <CalendarGridRow
                v-for="(weekDates, index) in month.rows"
                :key="index"
                class="grid grid-cols-7">
                <CalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  class="text-center text-sm"
                  :date="weekDate">
                  <CalendarCellTrigger
                    class="text-c-1 hover:bg-b-2 data-[selected]:bg-b-btn data-[selected]:text-c-btn data-[outside-view]:text-c-3 mx-auto flex size-8 cursor-pointer items-center justify-center rounded text-sm outline-offset-2 data-[today]:font-bold"
                    :day="weekDate"
                    :month="month.value" />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>

        <!-- Time: a themed segmented field (radix-vue has no standalone time field here) -->
        <div
          v-if="showTime"
          class="flex items-center justify-between gap-2 px-2 text-sm">
          <span class="text-c-2">{{
            translate('apiClient.datePicker.time')
          }}</span>
          <DateFieldRoot
            v-slot="{ segments }"
            v-model="timeModel"
            :aria-label="translate('apiClient.datePicker.time')"
            class="border-c-3 bg-b-1 text-c-1 flex items-center rounded border px-2 py-1.5"
            granularity="second"
            :hourCycle="24"
            :locale="calendarLocale">
            <DateFieldInput
              v-for="(item, index) in timeSegments(segments)"
              :key="index"
              :aria-label="timeSegmentLabels[item.part]"
              :class="
                item.part === 'literal'
                  ? 'text-c-3'
                  : 'data-[placeholder]:text-c-3 focus:bg-b-btn focus:text-c-btn rounded focus:outline-none'
              "
              :part="item.part">
              {{ item.value }}
            </DateFieldInput>
          </DateFieldRoot>
        </div>

        <div class="flex items-center justify-between gap-2 px-2">
          <ScalarButton
            size="sm"
            variant="outlined"
            @click="selectNow(close)">
            {{
              translate(
                type === 'date'
                  ? 'apiClient.datePicker.today'
                  : 'apiClient.datePicker.now',
              )
            }}
          </ScalarButton>
          <ScalarButton
            v-if="showTime"
            size="sm"
            @click="close">
            {{ translate('apiClient.datePicker.done') }}
          </ScalarButton>
        </div>

        <!-- Faker shortcuts (date-time only) -->
        <Disclosure
          v-if="fakerOptions.length"
          v-slot="{ open }"
          as="div"
          class="-mx-0.75 -mb-2 border-t">
          <DisclosureButton as="template">
            <ScalarButton
              class="w-full justify-start gap-2 px-2.75 text-start"
              size="sm"
              variant="ghost">
              <ScalarIconCaretRight
                class="text-c-3 size-3.5 shrink-0"
                :class="open ? 'rotate-90' : 'rtl:rotate-180'" />
              <span>{{
                translate('apiClient.datePicker.insertVariable')
              }}</span>
            </ScalarButton>
          </DisclosureButton>
          <DisclosurePanel class="flex flex-col px-2.75 pb-2">
            <ScalarButton
              v-for="option in fakerOptions"
              :key="option.name"
              class="justify-start ps-5.5 pe-2 text-start"
              size="sm"
              variant="ghost"
              @click="selectFaker(option.name, close)">
              {{ option.label }}
            </ScalarButton>
          </DisclosurePanel>
        </Disclosure>
      </div>
    </template>
  </ScalarPopover>
</template>
