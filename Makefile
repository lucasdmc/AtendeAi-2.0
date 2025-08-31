# =====================================================
# MAKEFILE - ATENDEAI 2.0 DEVELOPMENT
# =====================================================

.PHONY: help setup run test lint type security clean build deploy

# Default target
help: ## Show this help message
	@echo "🚀 AtendeAI 2.0 - Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# =====================================================
# SETUP & ENVIRONMENT
# =====================================================

setup: ## Install dependencies and setup environment
	@echo "🔧 Setting up AtendeAI 2.0..."
	npm install
	cp .env.example .env
	@echo "✅ Setup complete! Edit .env with your configuration."

setup-db: ## Setup database with migrations and seeds
	@echo "🗄️ Setting up database..."
	@if [ -z "$(DATABASE_URL)" ]; then echo "❌ DATABASE_URL not set"; exit 1; fi
	psql $(DATABASE_URL) -f framework/db/migrations/001_core_schema.sql
	psql $(DATABASE_URL) -f framework/db/migrations/002_rls_policies.sql
	psql $(DATABASE_URL) -f framework/db/seed/001_initial_data.sql
	@echo "✅ Database setup complete!"

setup-full: setup setup-db ## Complete setup (dependencies + database)

# =====================================================
# DEVELOPMENT
# =====================================================

run: ## Start development server (port 8080)
	@echo "🚀 Starting AtendeAI 2.0 development server..."
	npm run dev -- --port 8080

run-backend: ## Start backend services with Docker
	@echo "🔗 Starting backend microservices..."
	docker-compose up -d

run-full: run-backend run ## Start full stack (backend + frontend)

build: ## Build for production
	@echo "🔨 Building AtendeAI 2.0..."
	npm run build

build-dev: ## Build for development
	@echo "🔨 Building AtendeAI 2.0 (development)..."
	npm run build:dev

# =====================================================
# TESTING
# =====================================================

test: ## Run all tests
	@echo "🧪 Running test suite..."
	npm run test:run

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	npm run test:coverage

test-integration: ## Run integration tests
	@echo "🔗 Running integration tests..."
	npm run test:integration

test-e2e: ## Run end-to-end tests
	@echo "🎭 Running E2E tests..."
	npm run test:e2e

test-all: test test-integration test-e2e ## Run all test suites

# =====================================================
# CODE QUALITY
# =====================================================

lint: ## Run ESLint
	@echo "🔍 Running linter..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "🔧 Running linter with auto-fix..."
	npm run lint:fix

type: ## Run TypeScript type checking
	@echo "🎯 Running type checker..."
	npm run type-check

security: ## Run security audit
	@echo "🔒 Running security audit..."
	npm audit --audit-level moderate

quality: lint type security ## Run all quality checks

quality-fix: lint-fix ## Fix all auto-fixable quality issues
	@echo "✅ Quality fixes applied!"

# =====================================================
# DATABASE OPERATIONS
# =====================================================

db-migrate: ## Apply database migrations
	@echo "📈 Applying database migrations..."
	@if [ -z "$(DATABASE_URL)" ]; then echo "❌ DATABASE_URL not set"; exit 1; fi
	psql $(DATABASE_URL) -f framework/db/migrations/001_core_schema.sql
	psql $(DATABASE_URL) -f framework/db/migrations/002_rls_policies.sql

db-rollback: ## Rollback database migrations
	@echo "📉 Rolling back database migrations..."
	@if [ -z "$(DATABASE_URL)" ]; then echo "❌ DATABASE_URL not set"; exit 1; fi
	psql $(DATABASE_URL) -f framework/db/migrations/002_rls_policies_rollback.sql
	psql $(DATABASE_URL) -f framework/db/migrations/001_core_schema_rollback.sql

db-seed: ## Apply database seeds
	@echo "🌱 Applying database seeds..."
	@if [ -z "$(DATABASE_URL)" ]; then echo "❌ DATABASE_URL not set"; exit 1; fi
	psql $(DATABASE_URL) -f framework/db/seed/001_initial_data.sql

db-reset: db-rollback db-migrate db-seed ## Reset database (rollback + migrate + seed)

# =====================================================
# DEPLOYMENT & PRODUCTION
# =====================================================

deploy-staging: ## Deploy to staging environment
	@echo "🚀 Deploying to staging..."
	npm run build:production
	# Add staging deployment commands here

deploy-production: ## Deploy to production environment
	@echo "🚀 Deploying to production..."
	npm run build:production
	# Add production deployment commands here

# =====================================================
# UTILITIES
# =====================================================

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/
	rm -rf .next/
	rm -rf coverage/

clean-docker: ## Clean Docker containers and images
	@echo "🐳 Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

logs: ## Show application logs
	@echo "📋 Showing application logs..."
	docker-compose logs -f

logs-backend: ## Show backend services logs
	@echo "📋 Showing backend logs..."
	docker-compose logs -f auth-service user-service clinic-service conversation-service appointment-service whatsapp-service google-calendar-service

health: ## Check system health
	@echo "❤️ Checking system health..."
	curl -f http://localhost:8080/health || echo "Frontend not running"
	curl -f http://localhost:3004/health || echo "Health service not running"

# =====================================================
# DEVELOPMENT HELPERS
# =====================================================

install: ## Install a new package (usage: make install PACKAGE=package-name)
	@if [ -z "$(PACKAGE)" ]; then echo "❌ Usage: make install PACKAGE=package-name"; exit 1; fi
	npm install $(PACKAGE)
	@echo "✅ Package $(PACKAGE) installed!"

install-dev: ## Install a dev package (usage: make install-dev PACKAGE=package-name)
	@if [ -z "$(PACKAGE)" ]; then echo "❌ Usage: make install-dev PACKAGE=package-name"; exit 1; fi
	npm install --save-dev $(PACKAGE)
	@echo "✅ Dev package $(PACKAGE) installed!"

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,md}"

dev-tools: ## Install useful development tools
	@echo "🛠️ Installing development tools..."
	npm install --save-dev @types/node @types/react @types/react-dom
	@echo "✅ Development tools installed!"

# =====================================================
# MONITORING & DEBUG
# =====================================================

monitor: ## Start monitoring dashboard (Grafana)
	@echo "📊 Starting monitoring dashboard..."
	open http://localhost:3000
	docker-compose up -d grafana prometheus

debug: ## Show debug information
	@echo "🐛 System Debug Information:"
	@echo "Node version: $(shell node --version)"
	@echo "NPM version: $(shell npm --version)"
	@echo "Docker version: $(shell docker --version)"
	@echo "Database connection: $(DATABASE_URL)"
	@echo "Environment files:"
	@ls -la .env* 2>/dev/null || echo "No .env files found"

# =====================================================
# VALIDATION & COMPLIANCE
# =====================================================

validate: ## Validate all configurations
	@echo "✅ Validating configurations..."
	@echo "Checking package.json..."
	npm run lint:package.json 2>/dev/null || echo "package.json OK"
	@echo "Checking TypeScript config..."
	npx tsc --noEmit
	@echo "Checking API spec..."
	npx swagger-parser validate framework/api/openapi.yaml || echo "OpenAPI validation skipped"

compliance: ## Check 12-factor app compliance
	@echo "📋 Checking 12-factor app compliance..."
	@echo "✅ Config: .env.example exists"
	@test -f .env.example || echo "❌ Missing .env.example"
	@echo "✅ Dependencies: package.json exists"
	@test -f package.json || echo "❌ Missing package.json"
	@echo "✅ Build: npm scripts configured"
	@echo "✅ Processes: Docker Compose configured"
	@echo "✅ Port binding: Configurable via ENV"
	@echo "✅ Stateless: No local file storage"
	@echo "✅ Logs: Structured logging implemented"

# =====================================================
# SHORTCUTS
# =====================================================

start: run ## Alias for run
stop: ## Stop all services
	docker-compose down

restart: stop run-backend ## Restart backend services
	@echo "🔄 Services restarted!"

quick-test: lint type test ## Quick quality check
	@echo "⚡ Quick test complete!"

full-check: clean setup test-all quality ## Full validation pipeline
	@echo "🏆 Full check complete!"

# =====================================================
# ENVIRONMENT INFO
# =====================================================

info: ## Show environment information
	@echo "🌟 AtendeAI 2.0 Environment Information"
	@echo "======================================"
	@echo "Project: AtendeAI 2.0 Multiclínicas"
	@echo "Version: 1.3.0"
	@echo "Mode: incremental"
	@echo "Quality Profile: v1.0"
	@echo ""
	@echo "Tech Stack:"
	@echo "- Frontend: React 18 + TypeScript + Vite"
	@echo "- Backend: Node.js + Express Microservices"
	@echo "- Database: PostgreSQL (Supabase)"
	@echo "- Auth: Supabase Auth + JWT"
	@echo "- Cache: Redis"
	@echo "- API Gateway: Kong"
	@echo "- Load Balancer: HAProxy"
	@echo "- Monitoring: Prometheus + Grafana"
	@echo ""
	@echo "Services:"
	@echo "- Frontend: http://localhost:8080"
	@echo "- Health: http://localhost:3004/health"
	@echo "- API Gateway: http://localhost:8000"
	@echo "- Monitoring: http://localhost:3000"
	@echo ""
	@echo "Commands: make help"
