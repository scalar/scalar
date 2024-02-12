# Scalar API Reference for Laravel Scribe

Laravel Scribe is an amazing package to generate OpenAPI files from your existing code base. Clumsy annotations aren’t required, the package will just analyze your code.

## Table of Contents

- [Scalar API Reference for Laravel Scribe](#scalar-api-reference-for-laravel-scribe)
  - [Table of Contents](#table-of-contents)
  - [Set up Laravel (optional)](#set-up-laravel-optional)
  - [Set up Laravel Scribe](#set-up-laravel-scribe)

## Create a new Laravel project (optional)

If you’re starting fresh, download the Laravel installer with composer:

```bash
composer global require "laravel/installer=~1.1"
```

Once that’s done, you’re just one `laravel new` away from creating your (first?) Laravel app like this:

```bash
laravel new my-new-app
```

Those are the presets we’re using here, but all other presets should work just fine, too:

```bash

 ┌ Would you like to install a starter kit? ────────────────────┐
 │ Laravel Breeze                                               │
 └──────────────────────────────────────────────────────────────┘

 ┌ Which Breeze stack would you like to install? ───────────────┐
 │ Blade with Alpine                                            │
 └──────────────────────────────────────────────────────────────┘

 ┌ Would you like dark mode support? ───────────────────────────┐
 │ Yes                                                          │
 └──────────────────────────────────────────────────────────────┘

 ┌ Which testing framework do you prefer? ──────────────────────┐
 │ Pest                                                         │
 └──────────────────────────────────────────────────────────────┘

 ┌ Would you like to initialize a Git repository? ──────────────┐
 │ Yes                                                          │
 └──────────────────────────────────────────────────────────────┘
```

The setup will take a minute or so. Once it’s done, jump in your new directory:

```bash
cd my-new-app
```

I’ve selected SQLite, so I need to create an empty database:

```
touch database/database.sqlite
```

If you’ve choosen another database driver, add the required credentials to your `.env` file. Once you’re done, you can use [Laravel Herd](https://herd.laravel.com/) or just spin up a tiny PHP server from the command-line:

```
php artisan serve
```

You should see the default Laravel start page on http://127.0.0.1:8000 now.

## Set up Laravel Scribe

Cool, you’ve got your Laravel project running. Time to generate an OpenAPI file, that describes your API in a machine-readable format. Let’s start by installing Laravel Scribe:

```bash
composer require --dev --with-all-dependencies knuckleswtf/scribe
```

And add the default configuration to your project folder:

```bash
php artisan vendor:publish --tag=scribe-config
```

Laravel Scribe comes with a ton of configuration options, but for the purpose of this guide you only need to switch to the Scalar API reference. Update the following values:

```diff
-    'type' => 'static',
+    'type' => 'external_laravel',
-    'theme' => 'default',
+    'theme' => 'scalar',
```

Done! Are you ready to generate your (first?) OpenAPI file like this:

```bash
php artisan scribe:generate
```

If you’re curioius how it looks, take a peek at the file (`storage/app/scribe/openapi.yaml`). The YAML file should describe you’re API. If you’ve just set up a new Laravel project, it has probably one route (`/api/user`).

Anyway, time to look at your new API reference. Start the PHP server again (`php artisan serve`) and open the following URL in your browser:

http://127.0.0.1:8000/docs

Rad, isn’t it? Congrats, you’ve just set up Laravel Scribe.

Everytime you update your API, you can run `php artisan scribe:generate` to update your OpenAPI file (… and your API reference). Tedious, right? No worries, you can add [`vite-plugin-watch`](https://github.com/lepikhinb/vite-plugin-watch) to your Vite configuration to automate this.

It might be worse to add `php artisan scribe:generate` to your CI, too.
