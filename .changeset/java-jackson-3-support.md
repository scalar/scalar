---
'@scalar/java-integration': patch
---

Support both Jackson 2.x and Jackson 3.x. The Java integration now resolves the JSON serialization engine from whichever Jackson Databind the host application provides, so a single artifact works on both Jackson 2 and Jackson 3 (e.g. Spring Boot 3 and 4) without dependency conflicts.
