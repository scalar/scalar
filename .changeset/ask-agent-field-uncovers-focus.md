---
'@scalar/api-reference': patch
---

Collapse the Ask AI Agent field in the request example footer when focus leaves it, even with a question typed. The expanded field is drawn over the whole footer, so moving focus on to the example picker or Test Request used to land on a control hidden underneath it, with no visible focus ring. The typed question is kept and comes back when the field is focused again, and pressing the field or its send button no longer takes focus from the input, so a click still sends in Safari.
