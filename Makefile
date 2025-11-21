# Path to the Prisma CLI (prefer local binary to avoid global version mismatches)
PRISMA=./node_modules/.bin/prisma

# Docker compose setup (optional, remove if not using)
DC=docker-compose

# Prisma operations
.PHONY: prisma-generate prisma-migrate prisma-studio prisma-reset

prisma-generate:
	@echo "🔧 Generating Prisma client..."
	$(PRISMA) generate

prisma-studio:
	@echo "🌐 Opening Prisma Studio..."
	$(PRISMA) studio

prisma-reset:
	@echo "💥 Resetting database..."
	$(PRISMA) migrate reset

# Scaffold Node_modules
scaffold:
	@echo "📦 Creating module..."
	npx plop

# App operations
.PHONY: dev build start lint

dev:
	@echo "🚀 Starting dev server..."
	npm run dev

debug-build:
	@echo "🔧 Building and starting app in debug mode..."
	npm	run	build && node --inspect dist/index.js

build:
	@echo "📦 Building the app..."
	npm run build

start:
	@echo "🚀 Starting production server..."
	npm start

lint:
	@echo "🧹 Running linter..."
	npm run lint

# Clean node_modules (optional)
clean:
	@echo "🧼 Cleaning up..."
	rm -rf node_modules

# Help
.PHONY: help

help:
	@echo ""
	@echo "📦  Available Makefile targets:"
	@echo ""
	@echo "  make prisma-generate   - Generate Prisma client"
	@echo "  make prisma-migrate    - Run Prisma migrations"
	@echo "  make prisma-studio     - Open Prisma Studio"
	@echo "  make prisma-reset      - Reset DB and run migrations"
	@echo ""
	@echo "  make scaffold           - Create module using plop"
	@echo ""
	@echo "  make dev               - Run dev server (nodemon)"
	@echo "  make debug-build       - Build and start node in debug mode"
	@echo "  make build             - Build the app"
	@echo "  make start             - Start app in prod mode"
	@echo "  make lint              - Run linter"
	@echo "  make clean             - Remove node_modules"
	@echo "  make help              - Show this help"
	@echo ""
