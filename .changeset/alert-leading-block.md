---
'@scalar/code-highlight': patch
---

Keep the first block of a GitHub alert whose marker sits on its own line

An alert such as `> [!WARNING]` followed by a code block, list, table or a separate paragraph rendered as an empty box, because the content was read from the wrong position after the marker line was removed. With several blocks, only the later ones survived.
