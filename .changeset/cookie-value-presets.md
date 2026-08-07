---
'@scalar/api-client': minor
---

Add a preset switcher for global cookies that share a name. Instead of rendering one row per value (where toggling one toggled them all), same-named `x-scalar-cookies` now collapse into a single row with a dropdown to switch between the predefined values — for example a `Culture` cookie with `PL` and `EN`. Only the selected value is sent, and the choice persists.
