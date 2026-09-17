---
"@scalar/workspace-store": patch
"@scalar/blocks": patch
"@scalar/snippetz": patch
---

Support OpenAPI 3.2 cookie serialization with semicolon-separated entries and no percent-encoding in requests and code examples.

Browser XHR and jQuery code examples now set explicit Cookie header values through `document.cookie` and enable credentialed requests, including when no structured HAR cookies are supplied. Run the cookie setup on the request origin. Requests without cookie-style parameters retain structured HAR cookies alongside explicit Cookie headers.
