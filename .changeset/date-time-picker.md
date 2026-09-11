---
'@scalar/api-client': minor
---

Add a date and time picker for request fields with `format: date`, `date-time`, or `time`. A calendar/clock icon opens an accessible picker (built on radix-vue's Calendar) that writes a correctly formatted value back into the field. For `date-time` fields, the picker also offers shortcuts to insert faker variables like `{{$isoTimestamp}}` and `{{$randomDateFuture}}`. Free-text entry and `{{variables}}` keep working, so you can still type invalid data on purpose.
