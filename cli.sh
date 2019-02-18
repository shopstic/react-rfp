#!/usr/bin/env bash

set -euo pipefail

PATTERNS="src/**/**/*.{ts,tsx}"

build() {
  ./node_modules/.bin/tsc
}

lint() {
  ./node_modules/.bin/tslint -c tslint.json "${PATTERNS}"
}

check_format() {
  ./node_modules/.bin/prettier --config .prettierrc.js --list-different "${PATTERNS}"
}

format() {
  ./node_modules/.bin/prettier --config .prettierrc.js --write "${PATTERNS}"
}

"$@"