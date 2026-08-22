/*
 * Data behind the interactive SDK Generator demo.
 *
 * Everything here is a fixture: package registries, sample output, and the
 * build log for a fictional HR API called Warp. Nothing talks to a server.
 */

/* Package registries and sample output for each target Scalar can generate.
 * `stable: false` mirrors the experimental flag the dashboard shows. */
export const TARGETS = {
  typescript: {
    label: 'Typescript',
    logo: '<svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#3178C6"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" /></svg>',
    registry: 'npm',
    stable: true,
    packageName: 'warp-hr',
    install: 'npm install warp-hr',
    quickstartFile: 'index.ts',
    quickstart: `import WarpAPI from "warp-hr";

const client = new WarpAPI({
  apiKey: process.env["WARP_API_KEY"], // defaults to the WARP_API_KEY env var
});

// Auto-paginating: the next cursor page is fetched as you iterate.
for await (const assignment of client.timeOff.listAssignments({ limit: 50 })) {
  console.log(assignment.id, assignment.policy.name);
}`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.timeOff.listAssignments({ ...params }) -> Page<TimeOffAssignment>
  GET /v1/time-off/assignments
- client.timeOff.retrieveAssignment(id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.timeOff.createAssignment({ ...body }) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from TypeScript with the warp-hr package.
---

# Warp HR — TypeScript

## Install

npm install warp-hr

## Construct the client

The default export is the client. It reads WARP_API_KEY from the
environment, so the happy path needs no secret inline.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types. Read that before inventing a method name.`,
    files: [
      { path: 'sdk/typescript/', kind: 'dir' },
      { path: 'src/index.ts', depth: 1 },
      { path: 'src/client.ts', depth: 1 },
      { path: 'src/resources/time-off.ts', depth: 1 },
      { path: 'src/core/pagination.ts', depth: 1 },
      { path: 'src/lib/retry-with-backoff.ts', depth: 1, badge: 'your code' },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'package.json', depth: 1 },
    ],
  },
  python: {
    label: 'Python',
    logo: '<svg aria-hidden="true" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M74.2285 1.32866C68.144 1.35693 62.3334 1.87585 57.2207 2.78054C42.1594 5.44138 39.4248 11.0108 39.4248 21.2816V34.8464H75.0166V39.3679H39.4248H26.0675C15.7235 39.3679 6.66606 45.5853 3.833 57.4127C0.565098 70.9698 0.420149 79.4296 3.833 93.5853C6.36299 104.122 12.405 111.63 22.7489 111.63H34.9862V95.369C34.9862 83.6214 45.1506 73.259 57.2207 73.259H92.7711C102.667 73.259 110.567 65.111 110.567 55.1727V21.2816C110.567 11.6361 102.43 4.39035 92.7711 2.78054C86.6569 1.76276 80.313 1.30039 74.2285 1.32866ZM54.9807 12.2385C58.6571 12.2385 61.6593 15.2898 61.6593 19.0416C61.6593 22.7801 58.6571 25.8032 54.9807 25.8032C51.2911 25.8032 48.302 22.7801 48.302 19.0416C48.302 15.2898 51.2911 12.2385 54.9807 12.2385Z" fill="#306998" /><path d="M115.006 39.3679V55.1727C115.006 67.4259 104.617 77.739 92.771 77.739H57.2207C47.4829 77.739 39.4248 86.0733 39.4248 95.8253V129.716C39.4248 139.362 47.8123 145.035 57.2207 147.803C68.4871 151.115 79.2909 151.714 92.771 147.803C101.731 145.208 110.567 139.987 110.567 129.716V116.152H75.0166V111.63H110.567H128.363C138.707 111.63 142.561 104.415 146.159 93.5853C149.875 82.4363 149.717 71.7148 146.159 57.4127C143.602 47.1152 138.72 39.3679 128.363 39.3679H115.006ZM95.0111 125.195C98.7007 125.195 101.69 128.218 101.69 131.956C101.69 135.708 98.7007 138.76 95.0111 138.76C91.3347 138.76 88.3324 135.708 88.3324 131.956C88.3324 128.218 91.3347 125.195 95.0111 125.195Z" fill="#FFD43B" /></svg>',
    registry: 'PyPI',
    stable: true,
    packageName: 'warp',
    install: 'pip install warp',
    quickstartFile: 'main.py',
    quickstart: `import os

from warp import Warp

client = Warp(api_key=os.environ.get("WARP_API_KEY"))

# Auto-paginating: the next cursor page is fetched as you iterate.
for assignment in client.time_off.list_assignments(limit=50):
    print(assignment.id, assignment.policy.name)`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.time_off.list_assignments(**params) -> SyncCursorPage[TimeOffAssignment]
  GET /v1/time-off/assignments
- client.time_off.retrieve_assignment(assignment_id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.time_off.create_assignment(**body) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Python with the warp package.
---

# Warp HR — Python

## Install

pip install warp

## Construct the client

Warp() reads WARP_API_KEY from the environment. An AsyncWarp counterpart
exposes the same resource tree with await.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types.`,
    files: [
      { path: 'sdk/python/', kind: 'dir' },
      { path: 'src/warp/__init__.py', depth: 1 },
      { path: 'src/warp/_client.py', depth: 1 },
      { path: 'src/warp/resources/time_off.py', depth: 1 },
      { path: 'src/warp/pagination.py', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'pyproject.toml', depth: 1 },
    ],
  },
  go: {
    label: 'Go',
    logo: '<svg aria-hidden="true" viewBox="0 0 150 150" fill="#00ADD8" xmlns="http://www.w3.org/2000/svg"><path d="M73.7507 57.7669C67.5474 59.1677 63.3134 60.2184 57.2086 61.6193C55.7316 61.9695 55.6332 62.0571 54.3531 60.7437C52.8762 59.2553 51.7931 58.2922 49.7253 57.4166C43.522 54.7024 37.5157 55.4904 31.9032 58.73C25.2076 62.5824 21.7613 68.2735 21.8598 75.3654C21.9583 82.3699 27.3738 88.1485 35.1525 89.1116C41.8481 89.8996 47.4606 87.7983 51.8915 83.333C52.7777 82.3699 53.5654 81.3192 54.5501 80.0934C51.0053 80.0934 46.5744 80.0934 35.5464 80.0934C33.4786 80.0934 32.9863 78.9552 33.6756 77.4668C34.9556 74.7526 37.3188 70.1997 38.6973 67.9233C38.9927 67.3979 39.6819 66.5224 41.1589 66.5224C46.1806 66.5224 64.6919 66.5224 77 66.5224C76.8031 68.8864 76.8031 71.2504 76.4092 73.6143C75.3261 79.9183 72.6676 85.697 68.3351 90.7752C61.2457 99.0929 51.99 104.259 40.2727 105.66C30.6232 106.798 21.6629 105.134 13.7857 99.8809C6.49932 94.9778 2.36381 88.4987 1.2807 80.4436C0.000655659 70.9001 3.15152 62.3197 9.65019 54.79C16.6412 46.6474 25.8969 41.4816 37.2203 39.6429C46.476 38.1545 55.3378 39.1176 63.3134 43.9331C68.532 46.9976 72.2737 51.2002 74.7353 56.2784C75.3261 57.0664 74.9322 57.5042 73.7507 57.7669Z" /><path d="M105.959 105.365C97.0345 105.19 88.8946 102.914 82.0296 97.6614C76.2434 93.1967 72.6148 87.5064 71.438 80.7655C69.6727 70.8731 72.7129 62.1188 79.3817 54.3274C86.5409 45.9232 95.1711 41.5461 106.842 39.7077C116.845 38.1319 126.26 39.0073 134.792 44.1724C142.539 48.8997 147.345 55.2904 148.62 63.6946C150.287 75.5129 146.462 85.1427 137.342 93.3718C130.869 99.2372 122.925 102.914 113.805 104.577C111.157 105.015 108.509 105.103 105.959 105.365ZM129.3 69.9977C129.202 68.8596 129.202 67.9842 129.006 67.1088C127.24 58.442 118.316 53.5395 108.999 55.4655C99.8785 57.3039 93.9943 62.469 91.8367 70.698C90.0714 77.5264 93.7981 84.4424 100.859 87.2438C106.253 89.3448 111.647 89.0822 116.845 86.7185C124.592 83.1292 128.809 77.5264 129.3 69.9977Z" /></svg>',
    registry: 'Go modules',
    stable: true,
    packageName: 'github.com/TeamWarp/warp-go-sdk',
    install: 'go get github.com/TeamWarp/warp-go-sdk',
    quickstartFile: 'main.go',
    quickstart: `package main

import (
	"context"
	"fmt"
	"os"

	sdk "github.com/TeamWarp/warp-go-sdk"
	"github.com/TeamWarp/warp-go-sdk/option"
)

func main() {
	client := sdk.NewClient(option.WithAPIKey(os.Getenv("WARP_API_KEY")))

	iter := client.TimeOff.ListAssignmentsAutoPaging(context.Background(),
		sdk.TimeOffListAssignmentsParams{Limit: sdk.Int(50)})

	for iter.Next() {
		assignment := iter.Current()
		fmt.Println(assignment.ID, assignment.Policy.Name)
	}

	if err := iter.Err(); err != nil {
		panic(err)
	}
}`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.TimeOff.ListAssignments(ctx, params) (*Page[TimeOffAssignment], error)
  GET /v1/time-off/assignments
- client.TimeOff.RetrieveAssignment(ctx, id) (*TimeOffAssignment, error)
  GET /v1/time-off/assignments/{id}
- client.TimeOff.CreateAssignment(ctx, body) (*TimeOffAssignment, error)
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Go with the warp-go-sdk module.
---

# Warp HR — Go

## Install

go get github.com/TeamWarp/warp-go-sdk

## Construct the client

sdk.NewClient takes functional options. option.WithAPIKey is optional —
the client falls back to WARP_API_KEY.

## Look up a call signature

Every method is listed in api.md, grouped by resource, with its request
and response types.`,
    files: [
      { path: 'sdk/go/', kind: 'dir' },
      { path: 'client.go', depth: 1 },
      { path: 'timeoff.go', depth: 1 },
      { path: 'pagination.go', depth: 1 },
      { path: 'option/requestoption.go', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'go.mod', depth: 1 },
    ],
  },
  cli: {
    label: 'CLI',
    logo: '<svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><rect x="6" y="7.5" width="6" height="2" rx="1" transform="rotate(41 6 8.5)" /><rect x="6" y="14.5" width="6" height="2" rx="1" transform="rotate(-41 6 15.5)" /><rect x="12" y="14.5" width="5.5" height="2" rx="1" /></svg>',
    registry: 'npm and Homebrew',
    stable: true,
    packageName: 'warp',
    install: 'brew install teamwarp/tap/warp',
    quickstartFile: 'terminal',
    quickstart: `# Install from Homebrew, or run it with npx warp
brew install teamwarp/tap/warp

export WARP_API_KEY="wrp_live_..."

# Flags are typed from the OpenAPI parameters
warp time-off list-assignments --limit 50 --output table

# Every command speaks JSON too, so it composes
warp time-off list-assignments --output json | jq '.data[].policy.name'`,
    reference: `# Time Off

Commands:

- warp time-off list-assignments [--limit] [--cursor] [--output]
  GET /v1/time-off/assignments
- warp time-off retrieve-assignment <id> [--output]
  GET /v1/time-off/assignments/{id}
- warp time-off create-assignment --policy-id <id> --employee-id <id>
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-cli
description: Call the Warp HR API from the shell with the warp CLI.
---

# Warp HR — CLI

## Install

brew install teamwarp/tap/warp

## Authenticate

Set WARP_API_KEY, or run warp auth login to store a token in the
system keychain.

## Look up a command

warp --help lists every resource. api.md maps each command back to the
operation it calls.`,
    files: [
      { path: 'sdk/cli/', kind: 'dir' },
      { path: 'src/commands/time-off.ts', depth: 1 },
      { path: 'src/commands/index.ts', depth: 1 },
      { path: 'src/output/table.ts', depth: 1 },
      { path: 'completions/warp.bash', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'package.json', depth: 1 },
    ],
  },
  java: {
    label: 'Java',
    logo: '<svg aria-hidden="true" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1_26)"><path d="M54.4686 111.282C54.4686 111.282 48.703 114.788 58.4764 115.791C70.242 117.291 76.5092 117.043 89.5311 114.54C92.1482 116.142 94.9161 117.485 97.7952 118.547C68.4983 131.072 31.4248 117.797 54.4686 111.282ZM50.7186 95.0021C50.7186 95.0021 44.4561 99.7599 54.2248 100.768C66.9983 102.019 77.0155 102.268 94.303 98.7662C95.9842 100.471 98.0427 101.757 100.312 102.521C64.9967 113.04 25.4248 103.519 50.7186 95.0021ZM119.845 123.549C119.845 123.549 124.101 127.055 115.087 129.811C98.3061 134.827 44.7092 136.327 29.6811 129.811C24.4217 127.561 34.4389 124.304 37.6498 123.802C40.9077 123.052 42.6655 123.052 42.6655 123.052C36.8998 119.044 4.34515 131.316 26.1373 134.818C85.9967 144.586 135.337 130.561 119.808 123.549H119.845ZM57.178 77.9677C57.178 77.9677 29.878 84.4833 47.4092 86.7333C54.9233 87.7365 69.6983 87.4833 83.4748 86.4849C94.7436 85.4818 106.022 83.4849 106.022 83.4849C106.022 83.4849 102.014 85.238 99.2577 86.9912C71.4608 94.2568 18.1077 90.999 33.3889 83.4849C46.4108 77.2224 57.1827 77.9771 57.1827 77.9771L57.178 77.9677ZM106.022 105.268C134.072 90.7365 121.05 76.7208 112.031 78.4693C109.781 78.9708 108.773 79.4724 108.773 79.4724C108.773 79.4724 109.523 77.9724 111.276 77.4708C129.061 71.2083 143.086 96.2537 105.511 106.018C105.511 106.018 105.759 105.769 106.012 105.268H106.022ZM59.9436 144.84C86.9905 146.593 128.32 143.836 129.319 131.058C129.319 131.058 127.317 136.074 107.03 139.824C83.9858 144.08 55.4342 143.574 38.653 140.827C38.653 140.827 42.1592 143.832 59.9436 144.84Z" fill="#4E7896" /><path d="M89.0593 -4.68292C89.0593 -4.68292 104.589 11.0952 74.2843 34.8889C49.989 54.1733 68.7765 65.1936 74.2843 77.7186C60.0062 64.9452 49.7405 53.6718 56.753 43.1577C67.0187 27.6233 95.3218 20.1561 89.0593 -4.68292ZM81.0905 67.1999C88.3562 75.464 79.089 82.978 79.089 82.978C79.089 82.978 97.6234 73.4624 89.1062 61.6874C81.3437 50.4186 75.3249 44.9061 107.889 26.1233C107.889 26.1233 56.5468 38.8968 81.0905 67.1999Z" fill="#F58219" /></g><defs><clipPath id="clip0_1_26"><rect width="150" height="150" fill="white" /></clipPath></defs></svg>',
    registry: 'Maven Central',
    stable: false,
    packageName: 'dev.warp:warp-java',
    install: 'implementation("dev.warp:warp-java:1.5.0")',
    quickstartFile: 'Main.java',
    quickstart: `import dev.warp.client.WarpClient;
import dev.warp.models.timeoff.TimeOffListAssignmentsParams;

WarpClient client = WarpClient.builder()
    .apiKey(System.getenv("WARP_API_KEY"))
    .build();

client.timeOff()
    .listAssignments(TimeOffListAssignmentsParams.builder().limit(50).build())
    .autoPager()
    .forEach(assignment ->
        System.out.println(assignment.id() + " " + assignment.policy().name()));`,
    reference: `# Time Off

Types:

- \`TimeOffAssignment\`
- \`TimeOffPolicy\`

Methods:

- client.timeOff().listAssignments(params) -> TimeOffListAssignmentsPage
  GET /v1/time-off/assignments
- client.timeOff().retrieveAssignment(params) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.timeOff().createAssignment(params) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Java with the dev.warp:warp-java artifact.
---

# Warp HR — Java

## Install

implementation("dev.warp:warp-java:1.5.0")

## Construct the client

WarpClient.builder() reads WARP_API_KEY when apiKey is omitted. An async
client exposes the same resource tree returning CompletableFuture.

## Look up a call signature

Every method is listed in api.md, grouped by resource.`,
    files: [
      { path: 'sdk/java/', kind: 'dir' },
      { path: 'src/main/java/dev/warp/client/WarpClient.java', depth: 1 },
      { path: 'src/main/java/dev/warp/services/TimeOffService.java', depth: 1 },
      { path: 'src/main/java/dev/warp/core/Page.java', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'build.gradle.kts', depth: 1 },
    ],
  },
  ruby: {
    label: 'Ruby',
    logo: '<svg aria-hidden="true" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#CC342D"><path d="M20.156.083c3.033.525 3.893 2.598 3.829 4.77L24 4.822 22.635 22.71 4.89 23.926h.016C3.433 23.864.15 23.729 0 19.139l1.645-3 2.819 6.586.503 1.172 2.805-9.144-.03.007.016-.03 9.255 2.956-1.396-5.431-.99-3.9 8.82-.569-.615-.51L16.5 2.114 20.159.073l-.003.01zM0 19.089zM5.13 5.073c3.561-3.533 8.157-5.621 9.922-3.84 1.762 1.777-.105 6.105-3.673 9.636-3.563 3.532-8.103 5.734-9.864 3.957-1.766-1.777.045-6.217 3.612-9.75l.003-.003z" /></svg>',
    registry: 'RubyGems',
    stable: false,
    packageName: 'warp',
    install: 'bundle add warp',
    quickstartFile: 'main.rb',
    quickstart: `require "warp"

client = Warp::Client.new(api_key: ENV["WARP_API_KEY"])

# Auto-paginating: the next cursor page is fetched as you iterate.
client.time_off.list_assignments(limit: 50).each do |assignment|
  puts "#{assignment.id} #{assignment.policy.name}"
end`,
    reference: `# Time Off

Types:

- \`Warp::Models::TimeOffAssignment\`
- \`Warp::Models::TimeOffPolicy\`

Methods:

- client.time_off.list_assignments(**params) -> Warp::CursorPage
  GET /v1/time-off/assignments
- client.time_off.retrieve_assignment(id) -> TimeOffAssignment
  GET /v1/time-off/assignments/{id}
- client.time_off.create_assignment(**body) -> TimeOffAssignment
  POST /v1/time-off/assignments`,
    skill: `---
name: warp-hr
description: Call the Warp HR API from Ruby with the warp gem.
---

# Warp HR — Ruby

## Install

bundle add warp

## Construct the client

Warp::Client.new reads WARP_API_KEY from the environment when api_key
is omitted.

## Look up a call signature

Every method is listed in api.md, grouped by resource.`,
    files: [
      { path: 'sdk/ruby/', kind: 'dir' },
      { path: 'lib/warp.rb', depth: 1 },
      { path: 'lib/warp/client.rb', depth: 1 },
      { path: 'lib/warp/resources/time_off.rb', depth: 1 },
      { path: 'lib/warp/cursor_page.rb', depth: 1 },
      { path: 'api.md', depth: 1 },
      { path: 'SKILL.md', depth: 1 },
      { path: 'README.md', depth: 1 },
      { path: 'warp.gemspec', depth: 1 },
    ],
  },
}

/* Targets the demo starts with, in dashboard order. */
export const INITIAL_TARGETS = ['typescript', 'python', 'go', 'cli']

/* Everything else is offered by the "Add target" menu. Languages without a
 * sample below are listed as available but generate the same shape. */
export const ADDITIONAL_TARGETS = ['java', 'ruby']

/* One generation run, as the build log renders it. Each entry is a line and
 * the delay before the next one, so the log paces like a real run. */
export const BUILD_LOG = [
  ['Loading registry document @warp/warp-hr@1.5.0', 320],
  ['Bundling external $refs — 18 documents', 420],
  ['Compiling to IR — 64 operations, 112 schemas', 620],
  ['Emitting typescript → sdk/typescript', 380],
  ['Emitting python → sdk/python', 340],
  ['Emitting go → sdk/go', 340],
  ['Emitting cli → sdk/cli', 340],
  ['Formatting with Biome, ruff and gofmt', 460],
  ['Writing openapi.augmented.json — 64 code samples', 400],
  ['Pushing generated output to scalar-generated', 420],
  ['Three-way merge onto scalar-next — 1 custom file carried forward', 520],
  ['Opened release pull request #128', 300],
]

/** The document every target on this page is generated from. */
export const API_DOCUMENT = `openapi: 3.1.0
info:
  title: Warp HR
  version: 1.5.0
servers:
  - url: https://api.warp.dev/v1
security:
  - apiKey: []
paths:
  /time-off/assignments:
    get:
      operationId: listTimeOffAssignments
      summary: List time off assignments
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        "200":
          description: A page of assignments
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TimeOffAssignmentPage"
components:
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-Api-Key
  schemas:
    TimeOffAssignmentPage:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: "#/components/schemas/TimeOffAssignment"
        next_cursor:
          type: string
    TimeOffAssignment:
      type: object
      required:
        - id
        - policy
      properties:
        id:
          type: string
        policy:
          $ref: "#/components/schemas/TimeOffPolicy"
    TimeOffPolicy:
      type: object
      properties:
        name:
          type: string
        accrual_days:
          type: number
`

/* The second tab. Privacy-enhanced host, and the embed is only ever given a
 * src once someone opens the tab — nothing is requested otherwise. */
export const VIDEO_EMBED = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0'

export const PAGE_URLS = {
  dashboard: 'dashboard.scalar.com',
  video: 'youtube.com/watch?v=dQw4w9WgXcQ',
  site: 'scalar.com',
}

/*
 * What the share sheet sends. Scalar's own headline and positioning line,
 * pointing at the dashboard — the sheet shares Scalar rather than whichever
 * mock tab happens to be in front, so this is fixed.
 */
export const SHARE_TITLE = 'Scalar — API interfaces built for developers and agents'
export const SHARE_TEXT = 'Create beautiful docs, SDKs and secure MCP servers from your API.'
export const SHARE_URL = 'https://dashboard.scalar.com'
export const SHARE_HOST = 'dashboard.scalar.com'
export const SHARE_MESSAGE = `${SHARE_TITLE}\n${SHARE_TEXT}\n${SHARE_URL}`

/* Slack has no compose-with-text URL, so the tile opens Slack and leaves the
 * message on the clipboard to paste. */
export const SLACK_URL = 'https://app.slack.com/client'

/* The third tab, opened from "+" in the tab overview. Like the video embed,
 * it is only ever given a src once someone opens that tab. */
export const SITE_EMBED = 'https://scalar.com'
