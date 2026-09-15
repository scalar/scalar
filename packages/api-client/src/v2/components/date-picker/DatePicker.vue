<script setup lang="ts">
import {
  CalendarDate,
  CalendarDateTime,
  type DateValue,
} from '@internationalized/date'
import { ScalarButton } from '@scalar/components/button'
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
import { computed, ref, watch } from 'vue'

import {
  formatValue,
  getLocalTimezoneOffset,
  parseValue,
  partsFromDate,
  type DateParts,
  type DatePickerType,
} from './date-parts'

const { modelValue, type } = defineProps<{
  /** The current field value; may be a formatted value, free text, or a variable. */
  modelValue: string
  /** Which OpenAPI string format this field carries. */
  type: DatePickerType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

/** Locale for the calendar's weekday/month labels; falls back to English. */
const locale =
  typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en'

/** Whether the calendar grid is shown (everything except the time-only picker). */
const showCalendar = computed(() => type !== 'time')

/** Whether the time controls are shown. */
const showTime = computed(() => type !== 'date')

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
const placeholder = ref<DateValue>(
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
        { name: '$isoTimestamp', label: 'Current timestamp' },
        { name: '$randomDateFuture', label: 'Random future date' },
        { name: '$randomDatePast', label: 'Random past date' },
        { name: '$randomDateRecent', label: 'Random recent date' },
      ]
    : [],
)

/** Emit a value built from the working fields, filling a local offset for `date-time`. */
const commit = (next: DateParts): void => {
  const resolved =
    type === 'date-time' && !next.offset
      ? {
          ...next,
          offset: getLocalTimezoneOffset(
            new Date(
              next.year,
              next.month - 1,
              next.day,
              next.hour,
              next.minute,
              next.second,
            ),
          ),
        }
      : next
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
    placement="bottom-end"
    teleport>
    <button
      :aria-label="type === 'time' ? 'Pick a time' : 'Pick a date'"
      class="text-c-2 hover:text-c-1 hover:bg-b-2 focus-visible:outline-c-accent -mr-0.5 rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      type="button">
      <component
        :is="type === 'time' ? ScalarIconClock : ScalarIconCalendarBlank"
        class="size-3.5" />
    </button>
    <template #popover="{ close }">
      <div class="flex w-64 flex-col gap-3 py-2">
        <!-- Calendar (accessible grid from radix-vue) -->
        <CalendarRoot
          v-if="showCalendar"
          v-slot="{ weekDays, grid }"
          class="px-2"
          :locale="locale"
          :modelValue="calendarValue as DateValue | undefined"
          :placeholder="placeholder as DateValue"
          @update:modelValue="(v) => handleCalendarSelect(v, close)"
          @update:placeholder="(v) => (placeholder = v)">
          <CalendarHeader class="mb-2 flex items-center justify-between">
            <CalendarPrev
              aria-label="Previous month"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 flex size-7 items-center justify-center rounded">
              <ScalarIconCaretLeft class="size-4" />
            </CalendarPrev>
            <CalendarHeading class="text-c-1 text-sm font-medium" />
            <CalendarNext
              aria-label="Next month"
              class="text-c-2 hover:text-c-1 hover:bg-b-2 flex size-7 items-center justify-center rounded">
              <ScalarIconCaretRight class="size-4" />
            </CalendarNext>
          </CalendarHeader>
          <CalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse">
            <CalendarGridHead>
              <CalendarGridRow class="grid grid-cols-7">
                <CalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
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
                  :date="weekDate"
                  class="text-center text-sm">
                  <CalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="text-c-1 hover:bg-b-2 data-[selected]:bg-b-btn data-[selected]:text-c-btn data-[outside-view]:text-c-3 mx-auto flex size-8 cursor-pointer items-center justify-center rounded text-sm outline-offset-2 data-[today]:font-bold" />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>

        <!-- Time: a themed segmented field (radix-vue has no standalone time field here) -->
        <div
          v-if="showTime"
          class="flex items-center justify-between gap-2 px-2 text-sm">
          <span class="text-c-2">Time</span>
          <DateFieldRoot
            v-slot="{ segments }"
            v-model="timeModel"
            aria-label="Time"
            class="border-c-3 bg-b-1 text-c-1 flex items-center rounded border px-2 py-1.5 tabular-nums"
            granularity="second"
            :hourCycle="24"
            :locale="locale">
            <DateFieldInput
              v-for="(item, index) in timeSegments(segments)"
              :key="index"
              :class="
                item.part === 'literal'
                  ? 'text-c-3'
                  : 'data-[placeholder]:text-c-3 focus:bg-b-btn focus:text-c-btn rounded px-px focus:outline-none'
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
            {{ type === 'date' ? 'Today' : 'Now' }}
          </ScalarButton>
          <ScalarButton
            v-if="showTime"
            size="sm"
            @click="close">
            Done
          </ScalarButton>
        </div>

        <!-- Faker shortcuts (date-time only) -->
        <details
          v-if="fakerOptions.length"
          class="border-c-3 border-t px-2 pt-2">
          <summary class="text-c-2 hover:text-c-1 cursor-pointer text-xs">
            Insert a variable
          </summary>
          <div class="mt-2 flex flex-col">
            <button
              v-for="option in fakerOptions"
              :key="option.name"
              class="text-c-1 hover:bg-b-2 flex items-center rounded px-2 py-1 text-left text-sm"
              type="button"
              @click="selectFaker(option.name, close)">
              {{ option.label }}
            </button>
          </div>
        </details>
      </div>
    </template>
  </ScalarPopover>
</template>
