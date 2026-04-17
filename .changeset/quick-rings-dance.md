---
'@scalar/snippetz': patch
---

Fix C libcurl snippet cleanup ordering to call `curl_easy_cleanup` before freeing `curl_mime` and header slists.
