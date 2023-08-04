#!/bin/bash

echo "✨ Switch to the directory of the script…"
cd cmd/wasm

echo "✨ Build the WASM file…"
GOOS=js GOARCH=wasm go build -o ../../assets/json.wasm

echo "✨ Switch back to the root directory…"
cd ../../

echo "✨ Create the dist/ directory…"
mkdir -p ./dist

echo "✨ Copy the wasm_exec.js file to the dist/ directory…"
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ./dist/wasm_exec.js

echo "✨ Copy the json.wasm file to the dist/ directory…"
cp "./assets/json.wasm" ./dist/json.wasm
