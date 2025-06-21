---
title: "Headings and Text"
description: "Headings and Text"
---

### Headings, Titles and Front Matter

It's expected that each file only contains one `h1` heading. This will be used as the page title.
If an h1 heading is not found, the title from the front matter will be used.

```md
---
# Note: title will be overridden with the first h1 if it exists
title: Front matter Title
description: "This page was parsed using all markdown!"
---
```

## Text Decoration

Standard git markdown is supported with text decorations like **bold**, _italic_, and `code`.

> You can also provide quotes  
> ...on multiple lines
