---
'@scalar/code-highlight': patch
---

Share one lowlight instance per language registry between `syntaxHighlight` and `htmlFromMarkdown` instead of registering and compiling every grammar for each code block, and replace it after a grammar fails to compile so later blocks that embed that grammar keep their text
