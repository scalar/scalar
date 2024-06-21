# Laravel

There’s [a wonderful package to generate OpenAPI files for Laravel](https://scribe.knuckles.wtf/laravel/) already.
Set the `type` to `external_laravel` (for Blade) or `external_static` (for HTML) and `theme` to `scalar`:

```php
<?php
// config/scribe.php

return [
  // …
  'type' => 'external_laravel',
  'theme' => 'scalar',
  // …
];
```

We wrote a [detailed integration guide for Laravel Scribe](/documentation/laravel-scribe.md),
too.
