#!/bin/bash
set -e

vite build
pnpm types:build
