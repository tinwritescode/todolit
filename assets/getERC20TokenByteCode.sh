#!/usr/bin/env bash
set -euo pipefail

# Print the bytecode of the ERC20Token contract.
# Default: runtime bytecode. Pass --creation to print creation bytecode.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SRC_FILE="$ROOT_DIR/assets/ERC20Token.sol"
CONTRACT_NAME="ERC20Token"
SOLC_VERSION="0.8.27"
OZ_TAG="v5.0.2"

# Prepare a temporary vendor directory for dependencies (no repo changes)
VENDOR_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t ozvendor)"
cleanup() { rm -rf "$VENDOR_DIR" 2>/dev/null || true; }
trap cleanup EXIT

if [[ ! -f "$SRC_FILE" ]]; then
  echo "Source not found: $SRC_FILE" >&2
  exit 1
fi

# Fetch OpenZeppelin Contracts and Contracts Upgradeable sources into temp dir
curl -fsSL "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/archive/refs/tags/${OZ_TAG}.tar.gz" | tar -xzf - -C "$VENDOR_DIR"
curl -fsSL "https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/${OZ_TAG}.tar.gz" | tar -xzf - -C "$VENDOR_DIR"

OZ_UPG_DIR="$(find "$VENDOR_DIR" -maxdepth 1 -type d -name 'openzeppelin-contracts-upgradeable-*' | head -n1)"
OZ_STD_DIR="$(find "$VENDOR_DIR" -maxdepth 1 -type d -name 'openzeppelin-contracts-*' ! -name '*upgradeable*' | head -n1)"

if [[ -z "${OZ_UPG_DIR:-}" || -z "${OZ_STD_DIR:-}" ]]; then
  echo "Failed to prepare OpenZeppelin sources in temp directory: $VENDOR_DIR" >&2
  exit 1
fi

MODE="runtime" # or "creation"
if [[ "${1:-}" == "--creation" ]]; then
  MODE="creation"
fi

run_solc() {
  if command -v solc >/dev/null 2>&1; then
    if solc --version | grep -q "Version: $SOLC_VERSION"; then
      solc "$@"
      return $?
    fi
  fi
  if command -v docker >/dev/null 2>&1; then
    docker run --rm \
      -v "$ROOT_DIR":"/sources" \
      -v "$VENDOR_DIR":"/vendor" \
      -w /sources \
      ethereum/solc:"$SOLC_VERSION" "$@"
  else
    echo "solc $SOLC_VERSION not found and docker not available." >&2
    echo "Install solc or docker, or run: brew install solidity" >&2
    exit 1
  fi
}

SOLC_ARGS=(
  --optimize
  --via-ir
  --base-path "$ROOT_DIR"
  --include-path "$VENDOR_DIR"
  "@openzeppelin/contracts-upgradeable=$OZ_UPG_DIR/contracts"
  "@openzeppelin/contracts=$OZ_STD_DIR/contracts"
)

if [[ "$MODE" == "runtime" ]]; then
  SOLC_ARGS+=(--bin-runtime)
else
  SOLC_ARGS+=(--bin)
fi

TMP_OUT_1="$(mktemp)"; TMP_ERR_1="$(mktemp)"
if run_solc "${SOLC_ARGS[@]}" "$SRC_FILE" >"$TMP_OUT_1" 2>"$TMP_ERR_1"; then
  RAW_OUTPUT="$(cat "$TMP_OUT_1")"
else
  RAW_OUTPUT=""
fi

# If first attempt failed or produced empty output, retry with container paths
if [[ -z "$RAW_OUTPUT" ]]; then
  UPG_BASE="$(basename "$OZ_UPG_DIR")"
  STD_BASE="$(basename "$OZ_STD_DIR")"
  SOLC_ARGS_DOCKER=(
    --optimize
    --via-ir
    --base-path "/sources"
    --include-path "/vendor"
    "@openzeppelin/contracts-upgradeable=/vendor/$UPG_BASE/contracts"
    "@openzeppelin/contracts=/vendor/$STD_BASE/contracts"
  )
  if [[ "$MODE" == "runtime" ]]; then
    SOLC_ARGS_DOCKER+=(--bin-runtime)
  else
    SOLC_ARGS_DOCKER+=(--bin)
  fi
  TMP_OUT_2="$(mktemp)"; TMP_ERR_2="$(mktemp)"
  if run_solc "${SOLC_ARGS_DOCKER[@]}" "/sources/assets/ERC20Token.sol" >"$TMP_OUT_2" 2>"$TMP_ERR_2"; then
    RAW_OUTPUT="$(cat "$TMP_OUT_2")"
  else
    echo "Compilation failed. See errors below:" >&2
    if [[ -s "$TMP_ERR_1" ]]; then
      echo "--- Attempt 1 (host paths) ---" >&2
      cat "$TMP_ERR_1" >&2
    fi
    if [[ -s "$TMP_ERR_2" ]]; then
      echo "--- Attempt 2 (docker paths) ---" >&2
      cat "$TMP_ERR_2" >&2
    fi
    exit 1
  fi
fi

if [[ -z "$RAW_OUTPUT" ]]; then
  echo "solc produced no output" >&2
  exit 1
fi

if [[ "$MODE" == "runtime" ]]; then
  BYTECODE=$(awk -v c="$CONTRACT_NAME" '
    $0 ~ "======= .*:" c " =======" { incontract=1 }
    incontract && /^Binary of the runtime part:/ { getline; print; exit }
  ' <<<"$RAW_OUTPUT")
else
  BYTECODE=$(awk -v c="$CONTRACT_NAME" '
    $0 ~ "======= .*:" c " =======" { incontract=1 }
    incontract && /^Binary:/ { getline; print; exit }
  ' <<<"$RAW_OUTPUT")
fi

if [[ -z "${BYTECODE:-}" ]]; then
  echo "Failed to extract $MODE bytecode for contract $CONTRACT_NAME" >&2
  echo "solc output:" >&2
  echo "$RAW_OUTPUT" | sed -e 's/^/  /' >&2
  exit 1
fi

if [[ "$BYTECODE" != 0x* ]]; then
  BYTECODE="0x$BYTECODE"
fi

printf "%s" "$BYTECODE"


