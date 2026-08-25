# llms.txt

Every published Scalar Docs site automatically serves `/llms.txt` and `/llms-full.txt` so AI agents and LLMs can read your documentation. These files follow the [llms.txt convention](https://llmstxt.org) and are generated for you. You do not configure or author them.

## llms.txt

`llms.txt` is a structured index of your site. It starts with an H1 for your site title and a short summary as a blockquote, followed by `##` sections that mirror your navigation groups. Each section is a bullet list of links to the pages, pointing at their `.md` URLs, with the page description where one is available.

```markdown
# Your Documentation

> A short summary of your site

## Guides

- [Home](https://your-domain/index.md): The landing page
- [Getting Started](https://your-domain/getting-started/index.md)

## Reference

- [Scalar Galaxy](https://your-domain/api-reference/openapi.json): Explore the Galaxy API
```

The order is stable and follows your navigation, so identical content produces an identical file on every build.

## llms-full.txt

`llms-full.txt` is the full-text companion. It contains the complete Markdown of your pages, concatenated in the same navigation order as `llms.txt`. Use it when an agent needs the entire content of your docs in a single file rather than an index to fetch from.

## Discovery

Both files live at the root of your site:

```
https://your-domain/llms.txt
https://your-domain/llms-full.txt
```
