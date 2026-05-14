---
'@scalar/snippetz': patch
---

fix(snippetz): emit `CURLOPT_CUSTOMREQUEST` for PHP cURL snippets when the method is not GET or POST, so DELETE/PUT/PATCH requests render with the correct verb
