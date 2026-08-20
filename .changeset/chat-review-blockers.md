---
'@scalar/chat': patch
'@scalar/agent-chat': patch
'@scalar/api-reference': patch
---

Fix the four review blockers: the composer's send control now renders disabled on an empty draft (the state its muted treatment styles), the splitter bails to a whole-document parse when a link reference definition continues its destination on the next line (the truncated fragment rendered as literal text in every block), agent-chat clears the composer as soon as a send is issued (a keystroke during the submitted wait no longer strands the sent message in the field), and the agent panel's lazy-mount latch runs its watcher immediately so a re-mounted panel with the agent still open cannot render permanently empty
