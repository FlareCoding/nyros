#!/bin/bash
# =============================================================================
# Nyros Configuration Script
# =============================================================================
# One-time configuration of the build system. Run this once, then use ninja.
# =============================================================================

set -e

# Default values
BUILD_DIR="build"
BUILD_TYPE="Debug"
COMPILER=""
GENERATOR="Ninja"
EXTRA_ARGS=""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --release)
            BUILD_TYPE="Release"
            shift
            ;;
        --debug)
            BUILD_TYPE="Debug"
            shift
            ;;
        --clang)
            COMPILER="-DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++"
            shift
            ;;
        --gcc)
            COMPILER="-DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++"
            shift
            ;;
        --build-dir)
            BUILD_DIR="$2"
            shift 2
            ;;
        --generator)
            GENERATOR="$2"
            shift 2
            ;;
        --enable-tests)
            EXTRA_ARGS="$EXTRA_ARGS -DNYROS_BUILD_TESTS=ON"
            shift
            ;;
        --enable-lto)
            EXTRA_ARGS="$EXTRA_ARGS -DNYROS_ENABLE_LTO=ON"
            shift
            ;;
        --verbose)
            EXTRA_ARGS="$EXTRA_ARGS -DNYROS_VERBOSE_BUILD=ON"
            shift
            ;;
        --help)
            echo "Nyros Configuration Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --release         Configure for Release build"
            echo "  --debug           Configure for Debug build (default)"
            echo "  --clang           Use Clang compiler"
            echo "  --gcc             Use GCC compiler"
            echo "  --build-dir DIR   Set build directory (default: build)"
            echo "  --generator GEN   Set CMake generator (default: Ninja)"
            echo "  --enable-tests    Enable unit tests"
            echo "  --enable-lto      Enable Link-Time Optimization"
            echo "  --verbose         Enable verbose builds"
            echo "  --help            Show this help"
            echo ""
            echo "After configuration, use ninja to build:"
            echo "  ninja -C $BUILD_DIR image          # Build everything (kernel + bootable image)"
            echo "  ninja -C $BUILD_DIR nyros-kernel   # Build kernel only"
            echo "  ninja -C $BUILD_DIR clean          # Clean build"
            echo "  ninja -C $BUILD_DIR help           # Show all targets"
            echo ""
            echo "To run Nyros:"
            echo "  ./scripts/run.sh             # Run in QEMU"
            echo "  ./scripts/run.sh --debug     # Run with GDB support"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    Nyros Configuration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Build directory: $BUILD_DIR"
echo "Build type:      $BUILD_TYPE"
echo "Generator:       $GENERATOR"

# Create build directory
mkdir -p "$BUILD_DIR"

# Configure
echo ""
echo -e "${YELLOW}Configuring with CMake...${NC}"

cmake \
    -B "$BUILD_DIR" \
    -G "$GENERATOR" \
    -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
    $COMPILER \
    $EXTRA_ARGS \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Configuration successful!${NC}"
    echo ""
    echo "Build commands:"
    echo "  ninja -C $BUILD_DIR               # Build everything (kernel + bootable image)"
    echo "  ninja -C $BUILD_DIR nyros-kernel  # Build kernel only"
    echo "  ninja -C $BUILD_DIR clean         # Clean build artifacts"
    echo ""
    echo "Run commands:"
    echo "  ./scripts/run.sh             # Run in QEMU"
    echo "  ./scripts/run.sh --build     # Build and run"
    echo "  ./scripts/run.sh --debug     # Run with GDB support"
    echo "  ./scripts/run.sh --help      # See all options"
else
    echo -e "${RED}Configuration failed!${NC}"
    exit 1
fi
