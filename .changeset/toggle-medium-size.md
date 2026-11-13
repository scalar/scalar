---
'@scalar/components': minor
---

feat: add a medium size to ScalarToggle and ScalarTristateToggle

Pass `size="md"` for a larger toggle with a 20×32px track and a 16px thumb, sized to sit next to full-height form controls in settings rows. The tristate toggle's center position scales with it. The default stays `sm`, so existing toggles are unchanged. The input and group wrappers keep the `sm` toggle, since their form-row layout is built around it.
