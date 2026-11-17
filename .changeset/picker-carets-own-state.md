---
'@scalar/blocks': patch
---

fix(blocks): turn picker carets with their own menus

In the classic layout, the client picker and the example picker of an expanded operation pointed their carets up while their menus were closed, because the carets followed any open Headless UI ancestor, such as the operation accordion. Each caret now follows its own picker, so it points up only while that menu is open.
