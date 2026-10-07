# Commands

```
Usage: scalar [options] [command]

CLI to work with your OpenAPI files

Options:
  -v, --version       output the version number
  -h, --help          display help for command

Commands:
  readme              Open documentation for the CLI
  upgrade             Upgrade current version of your cli
  context             Print every command, argument, and option as JSON for AI
                      agents
  completion <shell>  Generate shell completion definitions
  auth                Manage authorization on scalar platform
  access-group        Manage access groups and allowed email domains for the
                      current team
  document            Manage local openapi file
  project             Manage scalar project
  registry            Manage your scalar registry
  team                Manage user teams
  sdk                 Manage your Scalar SDKs (Enterprise Only)
  schema              Manage your Scalar schemas
  help [command]      display help for command
```

## readme
```
Usage: scalar readme [options] [command]

Open documentation for the CLI

Options:
  -h, --help          display help for command

Commands:
  generate [options]  Self generate documentation for the cli
```

### generate
```
Usage: scalar readme generate [options]

Self generate documentation for the cli

Options:
  -o, --output [file]  Path where the documentation file will be written
  -h, --help           display help for command
```

## upgrade
```
Usage: scalar upgrade [options]

Upgrade current version of your cli

Options:
  -h, --help  display help for command
```

## context
```
Usage: scalar context [options]

Print every command, argument, and option as JSON for AI agents

Options:
  -h, --help  display help for command
```

## completion
```
Usage: scalar completion [options] <shell>

Generate shell completion definitions

Arguments:
  shell       Shell to configure (choices: "bash", "zsh", "fish")

Options:
  -h, --help  display help for command
```

## auth
```
Usage: scalar auth [options] [command]

Manage authorization on scalar platform

Options:
  -h, --help       display help for command

Commands:
  login [options]  Login to scalar
  whoami           Display the current user
  logout           Logout from scalar
  help [command]   display help for command
```

### login
```
Usage: scalar auth login [options]

Login to scalar

Options:
  --token <token>  Personal token
  -h, --help       display help for command
```

### whoami
```
Usage: scalar auth whoami [options]

Display the current user

Options:
  -h, --help  display help for command
```

### logout
```
Usage: scalar auth logout [options]

Logout from scalar

Options:
  -h, --help  display help for command
```

## access-group
```
Usage: scalar access-group [options] [command]

Manage access groups and allowed email domains for the current team

Options:
  -h, --help               display help for command

Commands:
  list [options]           List access groups for the current team
  create [options] <slug>  Create an access group (Pro or above)
  get [options] <slug>     Get an access group and its allowlists
  update [options] <slug>  Update access group metadata
  delete [options] <slug>  Delete an access group and remove its project
                           assignments
  domain                   Manage allowed email domains
  help [command]           display help for command
```

### list
```
Usage: scalar access-group list [options]

List access groups for the current team

Options:
  --json      Print the result as JSON
  -h, --help  display help for command
```

### create
```
Usage: scalar access-group create [options] <slug>

Create an access group (Pro or above)

Arguments:
  slug                   New access group slug

Options:
  --name <name>          Display name
  --domain <domains...>  Allowed email domains
  --json                 Print the result as JSON
  -h, --help             display help for command
```

### get
```
Usage: scalar access-group get [options] <slug>

Get an access group and its allowlists

Arguments:
  slug        Access group slug

Options:
  --json      Print the result as JSON
  -h, --help  display help for command
```

### update
```
Usage: scalar access-group update [options] <slug>

Update access group metadata

Arguments:
  slug               Current access group slug

Options:
  --name <name>      New display name
  --new-slug <slug>  New access group slug
  --json             Print the result as JSON
  -h, --help         display help for command
```

### delete
```
Usage: scalar access-group delete [options] <slug>

Delete an access group and remove its project assignments

Arguments:
  slug        Access group slug

Options:
  -y, --yes   Confirm deletion without prompting
  --json      Print the result as JSON (requires --yes)
  -h, --help  display help for command
```

### domain
```
Usage: scalar access-group domain [options] [command]

Manage allowed email domains

Options:
  -h, --help                        display help for command

Commands:
  add [options] <slug> <domain>     Add an exact email domain to an access group
  remove [options] <slug> <domain>  Remove an exact email domain from an access
                                    group
  help [command]                    display help for command
```

#### add
```
Usage: scalar access-group domain add [options] <slug> <domain>

Add an exact email domain to an access group

Arguments:
  slug        Access group slug
  domain      Email domain, such as example.com

Options:
  --json      Print the result as JSON
  -h, --help  display help for command
```

#### remove
```
Usage: scalar access-group domain remove [options] <slug> <domain>

Remove an exact email domain from an access group

Arguments:
  slug        Access group slug
  domain      Email domain, such as example.com

Options:
  --json      Print the result as JSON
  -h, --help  display help for command
```

## document
```
Usage: scalar document [options] [command]

Manage local openapi file

Options:
  -h, --help                     display help for command

Commands:
  bundle [options] [file|url]    Bundle an OpenAPI document by resolving all
                                 references and external dependencies
  split [options] [file|url]     Split OpenAPI or AsyncAPI documents into small
                                 chunks
  join [options] <files...>      Merge multiple OpenAPI or AsyncAPI documents
                                 into a single unified document
  format [options] [file|url]    Format an OpenAPI or AsyncAPI file
  convert [options] [file|url]   Convert a Postman collection to an OpenAPI
                                 document
  markdown [options] [file|url]  Generate Markdown from an OpenAPI file
  mock [options] [file|url]      Mock an OpenAPI API or AsyncAPI WebSocket and
                                 SSE channels
  serve [options] [file|url]     Serve an API Reference from an OpenAPI or
                                 AsyncAPI file
  share [options] [file]         Share an OpenAPI or AsyncAPI file
  validate [file|url]            Validate an OpenAPI or AsyncAPI file
  void [options]                 Boot a server to mirror HTTP requests
  lint [options] [file|url]      Lint your OpenAPI or AsyncAPI file using
                                 spectral rules
  upgrade [options] [file|url]   Upgrade an OpenAPI or AsyncAPI document to
                                 version 3.1
  help [command]                 display help for command
```

### bundle
```
Usage: scalar document bundle [options] [file|url]

Bundle an OpenAPI document by resolving all references and external dependencies

Arguments:
  file|url              Path to OpenAPI file or URL to bundle

Options:
  -o, --output <file>   Path to save the bundled output file
  --treeShake           Remove unused components from the bundled output
  --urlMap              Generate a map of resolved URLs in the bundled output
  --fetchLimit <limit>  Maximum number of URLs to fetch during bundling at the
                        same time
  -h, --help            display help for command
```

### split
```
Usage: scalar document split [options] [file|url]

Split OpenAPI or AsyncAPI documents into small chunks

Arguments:
  file|url             Path to OpenAPI or AsyncAPI file or URL to split

Options:
  -o, --output <path>  Path to save the chunks
  -h, --help           display help for command
```

### join
```
Usage: scalar document join [options] <files...>

Merge multiple OpenAPI or AsyncAPI documents into a single unified document

Arguments:
  files                                           Paths to the OpenAPI or AsyncAPI files to merge

Options:
  -o, --output <file>                             Path to save the merged output file
  -p, --prefix-components-with-path-value <path>  Dot-separated path to extract a prefix value from each input file for component names
  -h, --help                                      display help for command
```

### format
```
Usage: scalar document format [options] [file|url]

Format an OpenAPI or AsyncAPI file

Arguments:
  file|url             File or URL to format

Options:
  -o, --output <file>  Output file
  -h, --help           display help for command
```

### convert
```
Usage: scalar document convert [options] [file|url]

Convert a Postman collection to an OpenAPI document

Arguments:
  file|url             Postman collection file path or URL to convert

Options:
  -o, --output <file>  Output file (defaults to stdout)
  --merge-operations   Merge operations with shared path+method combinations
  -h, --help           display help for command
```

### markdown
```
Usage: scalar document markdown [options] [file|url]

Generate Markdown from an OpenAPI file

Arguments:
  file|url             OpenAPI file path or URL to convert

Options:
  -o, --output <file>  Output file (defaults to stdout)
  -h, --help           display help for command
```

### mock
```
Usage: scalar document mock [options] [file|url]

Mock an OpenAPI API or AsyncAPI WebSocket and SSE channels

Arguments:
  file|url           OpenAPI or AsyncAPI file or URL to mock

Options:
  -w, --watch        watch the file for changes
  -o, --once         run the server only once and exit after that
  -p, --port <port>  set the HTTP port for the mock server
  -h, --help         display help for command
```

### serve
```
Usage: scalar document serve [options] [file|url]

Serve an API Reference from an OpenAPI or AsyncAPI file

Arguments:
  file|url             OpenAPI or AsyncAPI file or URL to show the reference for

Options:
  -c, --config <file>  JSON file with API Reference configuration
  -w, --watch          watch the file for changes
  -o, --once           run the server only once and exit after that
  -p, --port <port>    set the HTTP port for the API reference server
  -h, --help           display help for command
```

### share
```
Usage: scalar document share [options] [file]

Share an OpenAPI or AsyncAPI file

Arguments:
  file                 file to share

Options:
  -t, --token <token>  pass a token to update an existing sandbox
  -h, --help           display help for command
```

### validate
```
Usage: scalar document validate [options] [file|url]

Validate an OpenAPI or AsyncAPI file

Arguments:
  file|url    File or URL to validate

Options:
  -h, --help  display help for command
```

### void
```
Usage: scalar document void [options]

Boot a server to mirror HTTP requests

Options:
  -o, --once         run the server only once and exit after that
  -p, --port <port>  set the HTTP port for the mock server
  -h, --help         display help for command
```

### lint
```
Usage: scalar document lint [options] [file|url]

Lint your OpenAPI or AsyncAPI file using spectral rules

Arguments:
  file|url                 OpenAPI or AsyncAPI file path or url

Options:
  -r, --rule <file|url>    Rule path or url
  --format <format>        Report format (choices: "text", "codeframe",
                           "markdown", "summary", "json", "github-actions",
                           "junit", default: "codeframe")
  --max-problems <number>  Maximum displayed findings (totals and exit status
                           include all findings) (default: 100)
  -o, --output <file>      Write the report to a file instead of stdout
  --generate-ignore-file   Record current findings in the ignore baseline
  --ignore-file <file>     Ignore baseline path (Scalar file takes priority over
                           Redocly fallback in the current directory)
  -h, --help               display help for command
```

### upgrade
```
Usage: scalar document upgrade [options] [file|url]

Upgrade an OpenAPI or AsyncAPI document to version 3.1

Arguments:
  file|url             File or URL to upgrade

Options:
  -o, --output <file>  Path to save the upgraded output file
  -h, --help           display help for command
```

## project
```
Usage: scalar project [options] [command]

Manage scalar project

Options:
  -h, --help                  display help for command

Commands:
  list [options]              List projects and their slugs for the current
                              team.
  get [options] <slug>        Get project details for the current team.
  init [options]              Create a new Scalar Docs project.
  check-config [file]         Check a Scalar Configuration file
  create [options]            Create a new project that is not linked to a
                              github project.
  preview [options] [config]  Preview scalar guides
  publish [options]           Publish new build for a github sync project that
                              is not linked.
  rollback [options]          Roll the live deployment back to a previously
                              deployed build.
  deployments                 Inspect a project deployment history.
  upgrade [config]            Upgrade scalar project
  help [command]              display help for command
```

### list
```
Usage: scalar project list [options]

List projects and their slugs for the current team.

Options:
  --json      Print project details as JSON
  -h, --help  display help for command
```

### get
```
Usage: scalar project get [options] <slug>

Get project details for the current team.

Arguments:
  slug        Project slug from scalar project list

Options:
  --json      Print project details as JSON
  -h, --help  display help for command
```

### init
```
Usage: scalar project init [options]

Create a new Scalar Docs project.

Options:
  -s, --subdomain [url]  subdomain to publish on
  --force                override existing configuration
  -h, --help             display help for command
```

### check-config
```
Usage: scalar project check-config [options] [file]

Check a Scalar Configuration file

Arguments:
  file        File to check

Options:
  -h, --help  display help for command
```

### create
```
Usage: scalar project create [options]

Create a new project that is not linked to a github project.

Options:
  -n, --name <name>  name of your project
  -s, --slug <slug>  project slug
  -h, --help         display help for command
```

### preview
```
Usage: scalar project preview [options] [config]

Preview scalar guides

Arguments:
  config                   Path to the Scalar configuration file (usually
                           `scalar.config.json5` or `scalar.config.json`)

Options:
  -p, --port [port]        port to run the server on. If the port is not
                           available, it will select another one. (default:
                           "7970")
  -H, --host [host]        Specify which IP addresses the server should listen
                           on.
  -L, --log-level <level>  Set the log level (choices: "debug", "info", default:
                           "info")
  -N, --no-open            Do not open the browser automatically
  -h, --help               display help for command
```

### publish
```
Usage: scalar project publish [options]

Publish new build for a github sync project that is not linked.

Options:
  -s, --slug [slug]      Project slug from scalar project list
  -c, --config [config]  Your config file of the project
  -p, --preview          Publish in preview mode
  -g, --github           Publish from your linked remote GitHub repository
  -h, --help             display help for command
```

### rollback
```
Usage: scalar project rollback [options]

Roll the live deployment back to a previously deployed build.

Options:
  -s, --slug [slug]      Project slug from scalar project list
  -t, --to <publishUid>  Roll back to a specific build id (defaults to the next
                         older deployed build)
  -y, --yes              Skip the confirmation prompt
  -h, --help             display help for command
```

### deployments
```
Usage: scalar project deployments [options] [command]

Inspect a project deployment history.

Options:
  -h, --help      display help for command

Commands:
  list [options]  List the production deployment history for a project.
  help [command]  display help for command
```

#### list
```
Usage: scalar project deployments list [options]

List the production deployment history for a project.

Options:
  -s, --slug [slug]  Project slug from scalar project list
  -h, --help         display help for command
```

### upgrade
```
Usage: scalar project upgrade [options] [config]

Upgrade scalar project

Arguments:
  config      Path to the Scalar configuration file (usually
              `scalar.config.json5` or `scalar.config.json`)

Options:
  -h, --help  display help for command
```

## registry
```
Usage: scalar registry [options] [command]

Manage your scalar registry

Options:
  -h, --help                           display help for command

Commands:
  publish [options] [file]             Publish an OpenAPI document to the Scalar
                                       registry
  update [options] [namespace] [slug]  Update document metadata on scalar
                                       registry
  delete [namespace] [slug]            Delete a document from scalar registry
  list [options]                       List all registry APIs for a team
                                       namespace
  get [options] [namespace] [slug]     Get a document version from scalar
                                       registry
  help [command]                       display help for command
```

### publish
```
Usage: scalar registry publish [options] [file]

Publish an OpenAPI document to the Scalar registry

Arguments:
  file                     OpenAPI file to upload

Options:
  --slug <slug>            Slug identifier for the registry entry. Defaults to
                           title.
  --namespace <namespace>  Scalar team namespace
  --version <version>      API version (e.g. 0.1.0)
  --private                Make API private (default: false)
  --no-current             Do not set as the current version
  --force                  Force override an existing version (default: false)
  --bundle                 Bundle all external references before uploading
  --treeShake              Remove unused components from the bundled document
  --urlMap                 Generate a map of resolved URLs when bundling the
                           document
  --fetchLimit <limit>     Maximum number of concurrent URLs to fetch when
                           bundling the document
  -h, --help               display help for command
```

### update
```
Usage: scalar registry update [options] [namespace] [slug]

Update document metadata on scalar registry

Arguments:
  namespace                    namespace of document you want to update
  slug                         slug of document you want to update

Options:
  --title <title>              Document title
  --description <description>  Document description
  -h, --help                   display help for command
```

### delete
```
Usage: scalar registry delete [options] [namespace] [slug]

Delete a document from scalar registry

Arguments:
  namespace   Team namespace
  slug        Managed doc slug

Options:
  -h, --help  display help for command
```

### list
```
Usage: scalar registry list [options]

List all registry APIs for a team namespace

Options:
  --namespace <namespace>  Team namespace
  --json                   Output registry API metadata as JSON
  -h, --help               display help for command
```

### get
```
Usage: scalar registry get [options] [namespace] [slug]

Get a document version from scalar registry

Arguments:
  namespace            Team namespace
  slug                 Managed doc slug

Options:
  --version <version>  Document version (defaults to latest)
  --format <format>    Output format (json or yaml) (choices: "json", "yaml",
                       default: "json")
  -o, --output <file>  Output file (defaults to stdout)
  -h, --help           display help for command
```

## team
```
Usage: scalar team [options] [command]

Manage user teams

Options:
  -h, --help      display help for command

Commands:
  list [options]  List all teams current user is part of
  get [options]   Get the current team and its namespaces
  set [options]   Set current active team for the user
  help [command]  display help for command
```

### list
```
Usage: scalar team list [options]

List all teams current user is part of

Options:
  --json      Output teams as JSON
  -h, --help  display help for command
```

### get
```
Usage: scalar team get [options]

Get the current team and its namespaces

Options:
  --json      Output the current team as JSON
  -h, --help  display help for command
```

### set
```
Usage: scalar team set [options]

Set current active team for the user

Options:
  --team <team>  Team uid
  -h, --help     display help for command
```

## sdk
```
Usage: scalar sdk [options] [command]

Manage your Scalar SDKs (Enterprise Only)

Options:
  -h, --help        display help for command

Commands:
  list [options]    List all SDKs for a team namespace
  get [options]     Inspect SDK metadata, API source, versions, and build status
  create [options]  Create a new SDK. The SDK is created in the namespace of the
                    API it is built from.
  update [options]  Update SDK metadata.
  delete [options]  Delete an SDK.
  build [options]   Build an SDK.
  help [command]    display help for command
```

### list
```
Usage: scalar sdk list [options]

List all SDKs for a team namespace

Options:
  --json                   Output structured SDK metadata as JSON
  --namespace <namespace>  Team namespace
  -h, --help               display help for command
```

### get
```
Usage: scalar sdk get [options]

Inspect SDK metadata, API source, versions, and build status

Options:
  -s, --slug <slug>            SDK slug
  -n, --namespace <namespace>  Team namespace
  --json                       Output structured SDK metadata as JSON
  -h, --help                   display help for command
```

### create
```
Usage: scalar sdk create [options]

Create a new SDK. The SDK is created in the namespace of the API it is built
from.

Options:
  -a, --api <api>              Registry API slug
  -n, --namespace <namespace>  Team namespace to look the API up in
  -l, --language <language>    Language of your SDK (choices: "typescript",
                               "python", "cli", "csharp", "java", "ruby", "php",
                               "go", "rust", "kotlin", "swift", "cpp", "dart")
  -h, --help                   display help for command
```

### update
```
Usage: scalar sdk update [options]

Update SDK metadata.

Options:
  -s, --slug <slug>            SDK slug
  -n, --namespace <namespace>  Team namespace
  --title <title>              Title
  --isPrivate <isPrivate>      Privacy (true/false or public/private) (choices:
                               "true", "false", "public", "private")
  -h, --help                   display help for command
```

### delete
```
Usage: scalar sdk delete [options]

Delete an SDK.

Options:
  -s, --slug <slug>            SDK slug
  -n, --namespace <namespace>  Team namespace
  -h, --help                   display help for command
```

### build
```
Usage: scalar sdk build [options]

Build an SDK.

Options:
  -s, --slug <slug>            SDK slug
  -n, --namespace <namespace>  Team namespace
  -h, --help                   display help for command
```

## schema
```
Usage: scalar schema [options] [command]

Manage your Scalar schemas

Options:
  -h, --help                        display help for command

Commands:
  delete [options]                  Delete a schema.
  update [options]                  Update schema metadata.
  list [options]                    List all schemas for a team namespace
  get [options] [namespace] [slug]  Get a schema document version from the
                                    Scalar registry
  publish [options] [file]          Publish a shared schema to the Scalar
                                    registry
  help [command]                    display help for command
```

### delete
```
Usage: scalar schema delete [options]

Delete a schema.

Options:
  -s, --slug <slug>            Schema slug
  -n, --namespace <namespace>  Team namespace
  -h, --help                   display help for command
```

### update
```
Usage: scalar schema update [options]

Update schema metadata.

Options:
  -s, --slug <slug>            Schema slug
  -n, --namespace <namespace>  Team namespace
  --title <title>              Title
  --description <description>  Description
  --isPrivate <isPrivate>      Privacy (true/false or public/private) (choices:
                               "true", "false", "public", "private")
  -h, --help                   display help for command
```

### list
```
Usage: scalar schema list [options]

List all schemas for a team namespace

Options:
  --namespace <namespace>  Team namespace
  --json                   Output schema metadata as JSON
  -h, --help               display help for command
```

### get
```
Usage: scalar schema get [options] [namespace] [slug]

Get a schema document version from the Scalar registry

Arguments:
  namespace            Team namespace
  slug                 Schema slug

Options:
  --version <version>  Schema version (defaults to latest)
  --format <format>    Output format (json or yaml) (choices: "json", "yaml",
                       default: "json")
  -o, --output <file>  Output file (defaults to stdout)
  -h, --help           display help for command
```

### publish
```
Usage: scalar schema publish [options] [file]

Publish a shared schema to the Scalar registry

Arguments:
  file                     OpenAPI file to upload

Options:
  --slug <slug>            Slug identifier for the registry entry. Defaults to
                           title.
  --title <title>          Schema title
  --namespace <namespace>  Scalar team namespace
  --version <version>      API version (e.g. 0.1.0)
  --private                Make API private (default: false)
  --force                  Force override an existing version (default: false)
  --bundle                 Bundle all external references before uploading
  --treeShake              Remove unused components from the bundled document
  --urlMap                 Generate a map of resolved URLs when bundling the
                           document
  --fetchLimit <limit>     Maximum number of concurrent URLs to fetch when
                           bundling the document
  -h, --help               display help for command
```


