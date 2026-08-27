---
'scalar-fastapi': patch
---

fix(fastapi): stop the default theme from hiding an introduction card

The bundled default theme included `.scalar-card:nth-of-type(3) { display: none }`, which hid whichever introduction card (server, authentication, client, …) happened to render third. Because that depends on the document and the Scalar version, it hid content unpredictably. The rule has been removed so all cards render.
