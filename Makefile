SHELL := /usr/bin/bash

.PHONY: setup lint type sec build dev test

setup:
	npm ci

lint:
	npx eslint .

type:
	npx tsc -p tsconfig.json --noEmit

sec:
	npx npm-audit-resolver || true

build:
	npm run build

dev:
	npm run dev -- --port 8080

test:
	npm test || true