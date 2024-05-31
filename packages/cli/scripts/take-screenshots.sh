#!/bin/bash

# Freeze
# Generate images of code and terminal output.
#
# Installation: brew install charmbracelet/tap/freeze
#
# URL: https://github.com/charmbracelet/freeze

# Commands
commands=(
    # "pnpm vite-node ./src/index.ts validate https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json"
    # "pnpm vite-node ./src/index.ts format https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json --output ./dist/.temp"
    # "pnpm vite-node ./src/index.ts share https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json"
    "pnpm vite-node ./src/index.ts serve https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json --once"
    "pnpm vite-node ./src/index.ts mock https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json --once"
    # "pnpm vite-node ./src/index.ts help"
)

# Take screenshots
for command in "${commands[@]}";
do
    # Get the name of the command
    name=$(echo $command | cut -d' ' -f4)
    # Get the command
    command=$(echo $command | cut -d' ' -f2-)

    # Take the screenshot
    freeze \
        --window \
        --padding 20 \
        --margin 20 \
        --width 800 --height 400 \
        --border.width 1 --border.color "#515151" --border.radius 8 \
        --execute "timeout 5 $command" \
        --output "screenshots/$name.png"
done

rm -Rf dist/.temp