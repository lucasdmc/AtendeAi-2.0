.PHONY: setup dev build lint type audit start

setup:
	npm ci
	npm run typecheck || true
	npm run lint || true
	npm run audit || true

dev:
	npm run dev -- --port 8080

build:
	npm run build

lint:
	npm run lint

type:
	npm run typecheck

audit:
	npm run audit || true

start: dev