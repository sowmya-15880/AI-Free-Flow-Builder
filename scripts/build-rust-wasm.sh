#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RUST_DIR="$ROOT_DIR/rust"
OUT_DIR="$ROOT_DIR/frontend/public/wasm"

if [ ! -d "$RUST_DIR" ]; then
  echo "Rust workspace not found: $RUST_DIR" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Ensure rustup/cargo are available in non-login shells.
if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck disable=SC1090
  . "$HOME/.cargo/env"
fi

if ! command -v wasm-pack >/dev/null 2>&1; then
  echo "wasm-pack is required. Install with: cargo install wasm-pack" >&2
  exit 1
fi

cd "$RUST_DIR/ffb_canvas_engine"
wasm-pack build --target web --release --out-dir "$OUT_DIR" --out-name ffb_canvas_engine

echo "Built Rust WASM to $OUT_DIR"
