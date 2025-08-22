#!/bin/bash
# =============================================================================
# Nyros GDB Connection Script
# =============================================================================
# Connects GDB to a running QEMU instance for kernel debugging.
# Start QEMU in debug mode first: ./scripts/run.sh --debug
# =============================================================================

set -e

# Default values
BUILD_DIR="${BUILD_DIR:-build}"
KERNEL_FILE="${BUILD_DIR}/kernel/nyros-kernel"
GDB_PORT="${GDB_PORT:-1234}"
GDB_SETUP="${GDB_SETUP:-gdb_setup.gdb}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p)
            GDB_PORT="$2"
            shift 2
            ;;
        --kernel|-k)
            KERNEL_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Nyros GDB Connection Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -p, --port PORT     GDB stub port (default: 1234)"
            echo "  -k, --kernel FILE   Kernel binary (default: build/kernel/nyros-kernel)"
            echo "  -h, --help          Show this help"
            echo ""
            echo "Before running this script:"
            echo "  1. Start QEMU in debug mode: ./scripts/run.sh --debug"
            echo "  2. QEMU will pause waiting for GDB"
            echo "  3. Run this script to connect"
            echo ""
            echo "GDB Commands:"
            echo "  c         - Continue execution"
            echo "  si        - Step one instruction"
            echo "  ni        - Next instruction (skip calls)"
            echo "  b <func>  - Set breakpoint at function"
            echo "  info reg  - Show registers"
            echo "  x/10i \$rip - Show next 10 instructions"
            echo "  bt        - Show backtrace"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if kernel file exists
if [ ! -f "$KERNEL_FILE" ]; then
    echo -e "${RED}Error: Kernel file not found: $KERNEL_FILE${NC}"
    echo "Build the kernel first with: ninja -C build"
    exit 1
fi

# Check if GDB setup file exists
if [ ! -f "$GDB_SETUP" ]; then
    echo -e "${YELLOW}Warning: GDB setup file not found: $GDB_SETUP${NC}"
    echo "Continuing without custom GDB configuration..."
    GDB_SETUP=""
fi

echo -e "${GREEN}Connecting GDB to Nyros kernel...${NC}"
echo "Target: localhost:$GDB_PORT"
echo "Kernel: $KERNEL_FILE"
echo ""

# Build GDB command
GDB_ARGS=(
    -ex "set architecture i386:x86-64"
    -ex "set disassembly-flavor intel"
)

# Source setup file if it exists
if [ -n "$GDB_SETUP" ]; then
    GDB_ARGS+=(-ex "source $GDB_SETUP")
fi

# Connect to target
GDB_ARGS+=(
    -ex "target remote localhost:$GDB_PORT"
    -ex "add-symbol-file $KERNEL_FILE"
)

# Set useful breakpoints
GDB_ARGS+=(
    -ex "b init"                    # Break at kernel init
)

# Print helpful message
GDB_ARGS+=(
    -ex "echo \n"
    -ex "echo Connected to Nyros kernel debugger\n"
    -ex "echo Breakpoints set at: init\n"
    -ex "echo Use 'c' to continue, 'si' to step\n"
    -ex "echo \n"
)

# Run GDB
exec gdb "${GDB_ARGS[@]}" "$KERNEL_FILE"
