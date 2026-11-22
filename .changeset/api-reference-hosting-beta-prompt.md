---
'@scalar/api-reference': patch
'@scalar/types': patch
---

feat(api-reference): invite developers to the API Hosting beta from the localhost reference

The localhost reference now shows the Deploy panel's waitlist card in a popup once, shortly after it loads, if nobody has started reading yet, as the API client invites its users. It only ever appears when a development server on the developer's own machine serves the page (`localhost`, `*.localhost`, `127.0.0.1`, `[::1]`, on an explicit port), never in automated browsers or jsdom. It is remembered across every port on the same host, and opening the Deploy panel counts too. Hosted references never show it, and `showDeveloperTools: 'never'` turns it off. The localhost toolbar's Deploy button now uses the gradient style.
