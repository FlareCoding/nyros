#!/bin/bash
# =============================================================================
# Nyros Run Script
# =============================================================================

set -e

# Default values
IMAGE_FILE="build/image/nyros.img"
DEBUG_MODE=false
HEADLESS=false
BUILD_FIRST=false

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --image|-i)
            IMAGE_FILE="$2"
            shift 2
            ;;
        --debug|-d)
            DEBUG_MODE=true
            shift
            ;;
        --headless|-n)
            HEADLESS=true
            shift
            ;;
        --build|-b)
            BUILD_FIRST=true
            shift
            ;;
        --help|-h)
            echo "Nyros Run Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -i, --image FILE    Use custom image file (default: build/image/nyros.img)"
            echo "  -b, --build         Build before running"
            echo "  -d, --debug         Enable GDB debugging"
            echo "  -n, --headless      Run without graphical output"
            echo "  -h, --help          Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                  # Run with defaults"
            echo "  $0 --build          # Build and run"
            echo "  $0 --debug          # Run with GDB support"
            echo ""
            echo "Note: The terminal becomes the QEMU monitor (Ctrl-A X to exit)"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build if requested
if [ "$BUILD_FIRST" = true ]; then
    echo -e "${YELLOW}Building Nyros...${NC}"
    if [ -f "build/build.ninja" ]; then
        ninja -C build image
    else
        echo -e "${RED}Build not configured. Run ./configure.sh first${NC}"
        exit 1
    fi
fi

# Check if image exists
if [ ! -f "$IMAGE_FILE" ]; then
    echo -e "${RED}Error: Image file not found: $IMAGE_FILE${NC}"
    echo ""
    echo "Build the image first with:"
    echo "  ninja -C build image"
    echo "Or use:"
    echo "  $0 --build"
    exit 1
fi

# Find OVMF firmware
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Try multiple locations for OVMF
OVMF_CODE=""
OVMF_VARS=""

# Check project directory first
if [ -f "$PROJECT_ROOT/ovmf/OVMF_CODE.fd" ]; then
    OVMF_CODE="$PROJECT_ROOT/ovmf/OVMF_CODE.fd"
    OVMF_VARS="$PROJECT_ROOT/ovmf/OVMF_VARS.fd"
# Check system locations
elif [ -f "/usr/share/ovmf/OVMF_CODE.fd" ]; then
    OVMF_CODE="/usr/share/ovmf/OVMF_CODE.fd"
    OVMF_VARS="/usr/share/ovmf/OVMF_VARS.fd"
elif [ -f "/usr/share/qemu/OVMF_CODE.fd" ]; then
    OVMF_CODE="/usr/share/qemu/OVMF_CODE.fd"
    OVMF_VARS="/usr/share/qemu/OVMF_VARS.fd"
elif [ -f "/usr/share/edk2/ovmf/OVMF_CODE.fd" ]; then
    OVMF_CODE="/usr/share/edk2/ovmf/OVMF_CODE.fd"
    OVMF_VARS="/usr/share/edk2/ovmf/OVMF_VARS.fd"
fi

if [ -z "$OVMF_CODE" ] || [ ! -f "$OVMF_CODE" ]; then
    echo -e "${YELLOW}Warning: OVMF firmware not found. UEFI boot may not work.${NC}"
fi

# Build QEMU command
QEMU_CMD="qemu-system-x86_64"
QEMU_ARGS=(
    -machine q35
    -cpu qemu64,+fsgsbase
    -m 4G
    -smp 4
    -drive "file=$IMAGE_FILE,format=raw"
    -net none
    -serial mon:stdio  # COM1 - QEMU monitor
    -serial unix:/tmp/nyros-debug.sock,server,nowait  # COM2 - Debug inspector socket
)

# Add UEFI firmware if available
if [ -n "$OVMF_CODE" ] && [ -f "$OVMF_CODE" ]; then
    # Create a copy of OVMF_VARS for this session
    OVMF_VARS_COPY="/tmp/nyros-ovmf-vars-$$.fd"
    cp "$OVMF_VARS" "$OVMF_VARS_COPY"
    
    QEMU_ARGS+=(
        -drive "if=pflash,format=raw,readonly=on,file=$OVMF_CODE"
        -drive "if=pflash,format=raw,file=$OVMF_VARS_COPY"
    )
    
    # Clean up temp file on exit
    trap "rm -f $OVMF_VARS_COPY /tmp/nyros-debug.sock" EXIT
else
    # Clean up debug socket on exit even without OVMF
    trap "rm -f /tmp/nyros-debug.sock" EXIT
fi

# Add debug options
if [ "$DEBUG_MODE" = true ]; then
    QEMU_ARGS+=(
        -gdb tcp::1234
        -S
        -no-reboot
        -no-shutdown
    )
    echo -e "${GREEN}QEMU started in debug mode.${NC}"
    echo -e "${YELLOW}QEMU is paused and waiting for GDB connection${NC}"
    echo ""
    echo "To connect GDB, run in another terminal:"
    echo "  ./scripts/connect-gdb.sh"
    echo ""
fi

# Add headless option
if [ "$HEADLESS" = true ]; then
    QEMU_ARGS+=(-nographic)
fi

# Show instructions
echo -e "${GREEN}Starting Nyros in QEMU${NC}"
echo -e "${YELLOW}Monitor commands: Ctrl-A H for help, Ctrl-A X to exit${NC}"
echo ""

# Run QEMU
$QEMU_CMD "${QEMU_ARGS[@]}"
