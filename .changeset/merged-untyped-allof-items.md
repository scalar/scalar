---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

fix: merge array items whose `allOf` describes an object without `type: object` on the first member into one example instead of one partial object per member
