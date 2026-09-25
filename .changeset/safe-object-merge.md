---
'@scalar/object-utils': patch
---

Update ts-deepmerge to prevent untrusted object properties from replacing built-in methods and breaking string conversion.

Properties named after built-in object methods, including `toString`, `valueOf`, and `hasOwnProperty`, are now omitted from merged data.
