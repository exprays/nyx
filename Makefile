.PHONY: all setup install build build-wasm run-sim run-web test clean help

all: help

help:
	@echo "Available commands:"
	@echo "  make setup      - Install dependencies for backend and frontend"
	@echo "  make build      - Build both the Go backend and Next.js frontend"
	@echo "  make build-wasm - Compile Go simulator package to browser WebAssembly"
	@echo "  make run-sim    - Run the Go simulator"
	@echo "  make run-web    - Run the Next.js dev server"
	@echo "  make test       - Run tests for Go backend"
	@echo "  make clean      - Clean build artifacts"

setup: install

install:
	@echo "Setting up Go dependencies..."
	cd impl/nyx && go mod tidy
	@echo "Setting up Web dependencies..."
	cd web && npm install

build-wasm:
	@echo "Building Go simulator to WebAssembly..."
	GOOS=js GOARCH=wasm go build -o web/public/sim.wasm impl/nyx/main.go

build: build-wasm
	@echo "Building Go backend..."
	mkdir -p bin
	cd impl/nyx && go build -o ../../bin/nyx
	@echo "Building Web frontend..."
	cd web && npm run build

run-sim:
	@echo "Running Go simulator..."
	cd impl/nyx && go run main.go

run-web:
	@echo "Running Web frontend dev server..."
	cd web && npm run dev

test:
	@echo "Running Go backend tests..."
	cd impl/nyx && go test ./...

clean:
	@echo "Cleaning Go build..."
	cd impl/nyx && go clean
	rm -rf bin
	@echo "Cleaning Web build..."
	rm -rf web/.next
