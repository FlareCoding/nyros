#!/bin/bash
# =============================================================================
# Nyros Quick Build Script
# =============================================================================
# Simple wrapper for common build operations. For one-time setup use configure.sh
# =============================================================================

set -e

BUILD_DIR="build"
TARGET="image"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            echo -e "${YELLOW}Cleaning build artifacts...${NC}"
            ninja -C "$BUILD_DIR" clean 2>/dev/null || echo "Nothing to clean"
            exit 0
            ;;
        --help)
            echo "Nyros Quick Build Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --clean   Clean build artifacts"
            echo "  --help    Show this help"
            echo ""
            echo "For configuration: ./configure.sh"
            echo "For running: ./scripts/run.sh"
            echo "For direct control: ninja -C build [target]"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if configured
if [ ! -f "$BUILD_DIR/build.ninja" ]; then
    echo -e "${YELLOW}Build not configured. Running configure.sh...${NC}"
    ./configure.sh
fi

# Build
echo -e "${YELLOW}Building Nyros...${NC}"
ninja -C "$BUILD_DIR" "$TARGET"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful!${NC}"
    echo "Image: $BUILD_DIR/image/nyros.img"
    echo ""
    echo "To run: ./scripts/run.sh"
else
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi