#!/bin/bash
# Local CI checks script for Nyros
# Run the same static analysis and build tests that CI runs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default options
RUN_STATIC_ANALYSIS=true
RUN_BUILD_TESTS=true
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-static-analysis)
            RUN_STATIC_ANALYSIS=false
            shift
            ;;
        --no-build-tests)
            RUN_BUILD_TESTS=false
            shift
            ;;
        --static-analysis-only)
            RUN_BUILD_TESTS=false
            shift
            ;;
        --build-tests-only)
            RUN_STATIC_ANALYSIS=false
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Run local CI checks for Nyros"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --no-static-analysis   Skip static analysis checks"
            echo "  --no-build-tests      Skip build matrix tests"
            echo "  --static-analysis-only Run only static analysis"
            echo "  --build-tests-only    Run only build tests"
            echo "  --verbose             Verbose output"
            echo "  --help                Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

echo ""
echo "========================================="
echo "    Nyros Local CI Checks"
echo "========================================="
echo ""

# Check for required tools
check_tool() {
    local tool=$1
    local package=$2
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${RED}Error: $tool not found${NC}"
        echo "Install with: sudo apt-get install $package"
        return 1
    fi
}

echo -e "${BLUE}Checking required tools...${NC}"
TOOLS_OK=true

if [ "$RUN_STATIC_ANALYSIS" = true ]; then
    check_tool "clang-tidy" "clang-tidy" || TOOLS_OK=false
    check_tool "cppcheck" "cppcheck" || TOOLS_OK=false
fi

if [ "$RUN_BUILD_TESTS" = true ]; then
    check_tool "ninja" "ninja-build" || TOOLS_OK=false
    check_tool "cmake" "cmake" || TOOLS_OK=false
    check_tool "gcc" "gcc" || TOOLS_OK=false
    check_tool "clang" "clang" || TOOLS_OK=false
fi

if [ "$TOOLS_OK" = false ]; then
    echo -e "${RED}Please install missing tools before running CI checks${NC}"
    exit 1
fi

echo -e "${GREEN}All required tools found${NC}"
echo ""

FAILED_CHECKS=()

# Static analysis
if [ "$RUN_STATIC_ANALYSIS" = true ]; then
    echo -e "${BLUE}Running static analysis...${NC}"
    
    # Ensure we have a build configured for clang-tidy
    if [ ! -f "build/compile_commands.json" ]; then
        echo "Configuring build for static analysis..."
        ./configure.sh --clang --debug > /dev/null
    fi
    
    # Run clang-tidy
    echo "Running clang-tidy..."
    if find kernel/src/ -name "*.cpp" -print0 | xargs -0 clang-tidy --config-file=.clang-tidy -p build/ --warnings-as-errors='*'; then
        echo -e "${GREEN}clang-tidy: PASSED${NC}"
    else
        echo -e "${RED}clang-tidy: FAILED${NC}"
        FAILED_CHECKS+=("clang-tidy")
    fi
    
    # Run cppcheck
    echo "Running cppcheck..."
    if cppcheck --enable=warning,style,performance,portability \
        --error-exitcode=1 \
        --suppress=missingIncludeSystem \
        --suppress=unusedFunction \
        --inline-suppr \
        --std=c++20 \
        -I kernel/include/ \
        kernel/src/; then
        echo -e "${GREEN}cppcheck: PASSED${NC}"
    else
        echo -e "${RED}cppcheck: FAILED${NC}"
        FAILED_CHECKS+=("cppcheck")
    fi
    echo ""
fi

# Build tests
if [ "$RUN_BUILD_TESTS" = true ]; then
    echo -e "${BLUE}Running build tests...${NC}"
    
    # Test key compiler/configuration combinations
    BUILD_CONFIGS=(
        "gcc debug 0"
        "gcc release 2"
        "clang debug 0"
        "clang release 2"
        "clang debug 1"
    )
    
    for config in "${BUILD_CONFIGS[@]}"; do
        read -r compiler build_type opt_level <<< "$config"
        
        echo "Testing: $compiler $build_type -O$opt_level"
        
        # Clean and configure
        rm -rf build/
        if ./configure.sh --$compiler --$build_type -O$opt_level > /dev/null 2>&1; then
            if ninja -C build nyros-kernel > /dev/null 2>&1; then
                echo -e "  ${GREEN}$compiler $build_type -O$opt_level: PASSED${NC}"
            else
                echo -e "  ${RED}$compiler $build_type -O$opt_level: BUILD FAILED${NC}"
                FAILED_CHECKS+=("build-$compiler-$build_type-O$opt_level")
            fi
        else
            echo -e "  ${RED}$compiler $build_type -O$opt_level: CONFIGURE FAILED${NC}"
            FAILED_CHECKS+=("configure-$compiler-$build_type-O$opt_level")
        fi
    done
    
    # Test image creation
    echo "Testing bootable image creation..."
    ./configure.sh --clang --debug > /dev/null 2>&1
    if ninja -C build image > /dev/null 2>&1; then
        echo -e "${GREEN}Image creation: PASSED${NC}"
    else
        echo -e "${RED}Image creation: FAILED${NC}"
        FAILED_CHECKS+=("image-creation")
    fi
    echo ""
fi

# Summary
echo "========================================="
echo "    CI Check Results"
echo "========================================="

if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
    echo -e "${GREEN}All checks PASSED${NC}"
    echo ""
    echo "Your code is ready for CI!"
    exit 0
else
    echo -e "${RED}Failed checks:${NC}"
    for check in "${FAILED_CHECKS[@]}"; do
        echo "  - $check"
    done
    echo ""
    echo -e "${YELLOW}Please fix the issues above before pushing${NC}"
    exit 1
fi
