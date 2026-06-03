.PHONY: all setup install build build-wasm run-impl run-web test clean help

ifeq ($(OS),Windows_NT)
    BUILD_WASM = powershell -Command "cd impl/nyx; $$env:GOOS='js'; $$env:GOARCH='wasm'; go build -o ../../web/public/sim.wasm main.go"
    MKDIR_BIN = if not exist bin mkdir bin
    CLEAN_BIN = powershell -Command "Remove-Item -Recurse -Force -ErrorAction SilentlyContinue bin"
    CLEAN_WEB = powershell -Command "Remove-Item -Recurse -Force -ErrorAction SilentlyContinue web/.next"
else
    BUILD_WASM = cd impl/nyx && GOOS=js GOARCH=wasm go build -o ../../web/public/sim.wasm main.go
    MKDIR_BIN = mkdir -p bin
    CLEAN_BIN = rm -rf bin
    CLEAN_WEB = rm -rf web/.next
endif

all: help

help:
	@echo "Available commands:"
	@echo "  make setup      - Install dependencies for backend and frontend"
	@echo "  make build      - Build both the Go backend and Next.js frontend"
	@echo "  make build-wasm - Compile Go implementation package to browser WebAssembly"
	@echo "  make run-impl   - Run the Go implementation"
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
	@echo "Building Go implementation to WebAssembly..."
	$(BUILD_WASM)

build: build-wasm
	@echo "Building Go backend..."
	$(MKDIR_BIN)
	cd impl/nyx && go build -o ../../bin/nyx
	@echo "Building Web frontend..."
	cd web && npm run build

run-impl:
	@echo "Running Go implementation..."
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
	$(CLEAN_BIN)
	@echo "Cleaning Web build..."
	$(CLEAN_WEB)
