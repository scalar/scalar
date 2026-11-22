---
'@scalar/api-reference': patch
'@scalar/types': patch
---

feat(api-reference): invite developers to the API Hosting beta from the localhost reference

The localhost reference now shows the API client's API Hosting beta popup once, shortly after it loads, if nobody has started reading yet. It is remembered across every port on the same host, and opening the Deploy panel counts too. Sign-ups join the same waitlist with the contact's `oss` property and the framework serving the reference. Hosted references never load or show it, and `showDeveloperTools: 'never'` turns it off.
