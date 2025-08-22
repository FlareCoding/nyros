#!/bin/bash
# Development Environment Setup Script for Nyros
# Sets up editor configurations and development tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "========================================="
echo "   Nyros Development Environment Setup   "
echo "========================================="
echo ""

# Function to setup VS Code
setup_vscode() {
    echo -e "${BLUE}Setting up VS Code configuration...${NC}"
    
    if [ -d "$PROJECT_ROOT/.vscode" ]; then
        echo -e "${YELLOW}Warning: .vscode directory already exists${NC}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping VS Code setup"
            return
        fi
        rm -rf "$PROJECT_ROOT/.vscode"
    fi
    
    cp -r "$SCRIPT_DIR/vscode" "$PROJECT_ROOT/.vscode"
    echo -e "${GREEN}✓ VS Code configuration installed${NC}"
    echo "  - IntelliSense configured for kernel development"
    echo "  - C++ extension settings optimized"
    echo "  - File associations and build tasks ready"
}

# Function to check and install dependencies
check_dependencies() {
    echo -e "${BLUE}Checking development dependencies...${NC}"
    
    local missing_deps=()
    
    # Check for clang
    if ! command -v clang &> /dev/null; then
        missing_deps+=("clang")
    fi
    
    # Check for ninja
    if ! command -v ninja &> /dev/null; then
        missing_deps+=("ninja-build")
    fi
    
    # Check for cmake
    if ! command -v cmake &> /dev/null; then
        missing_deps+=("cmake")
    fi
    
    # Check for QEMU
    if ! command -v qemu-system-x86_64 &> /dev/null; then
        missing_deps+=("qemu-system-x86")
    fi
    
    # Check for GDB
    if ! command -v gdb &> /dev/null; then
        missing_deps+=("gdb")
    fi
    
    # Check for grub tools
    if ! command -v grub-mkrescue &> /dev/null; then
        missing_deps+=("grub-pc-bin" "grub2-common")
    fi
    
    # Check for xorriso
    if ! command -v xorriso &> /dev/null; then
        missing_deps+=("xorriso")
    fi
    
    # Check for mtools
    if ! command -v mformat &> /dev/null; then
        missing_deps+=("mtools")
    fi
    
    if [ ${#missing_deps[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ All dependencies are installed${NC}"
    else
        echo -e "${YELLOW}Missing dependencies: ${missing_deps[*]}${NC}"
        echo ""
        echo "Install command for Ubuntu/Debian:"
        echo "  sudo apt update && sudo apt install -y ${missing_deps[*]}"
        echo ""
        echo "Install command for Fedora:"
        echo "  sudo dnf install -y ${missing_deps[*]}"
        echo ""
        echo "Install command for Arch:"
        echo "  sudo pacman -S ${missing_deps[*]}"
    fi
}

# Function to show editor setup instructions
show_editor_instructions() {
    echo ""
    echo -e "${BLUE}Editor Setup Instructions:${NC}"
    echo ""
    
    echo -e "${YELLOW}VS Code:${NC}"
    echo "  Run: $0 --vscode"
    echo "  Or manually copy: dev-setup/vscode/* → .vscode/"
    echo ""
    
    echo -e "${YELLOW}Vim/Neovim with LSP:${NC}"
    echo "  Install clangd plugin for your Vim distribution"
    echo "  The .clangd file is already configured"
    echo ""
    
    echo -e "${YELLOW}Emacs with LSP:${NC}"
    echo "  Install lsp-mode and lsp-clangd"
    echo "  The .clangd file provides the configuration"
    echo ""
    
    echo -e "${YELLOW}CLion/Other JetBrains IDEs:${NC}"
    echo "  Import the project as a CMake project"
    echo "  The compile_commands.json will be auto-generated"
    echo ""
    
    echo -e "${YELLOW}Any editor with clangd support:${NC}"
    echo "  Just ensure clangd is installed and configured to use .clangd"
}

# Function to run initial build
initial_build() {
    echo -e "${BLUE}Running initial build configuration...${NC}"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "configure.sh" ]; then
        echo -e "${RED}Error: configure.sh not found in project root${NC}"
        exit 1
    fi
    
    echo "Configuring build system..."
    ./configure.sh --clang --debug
    
    echo ""
    echo -e "${GREEN}✓ Build system configured${NC}"
    echo "  compile_commands.json symlink created automatically"
}

# Main logic
case "${1:-}" in
    --vscode)
        setup_vscode
        ;;
    --check-deps)
        check_dependencies
        ;;
    --build)
        initial_build
        ;;
    --all)
        check_dependencies
        echo ""
        initial_build
        echo ""
        show_editor_instructions
        ;;
    --help|-h)
        echo "Development Environment Setup for Nyros"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  --vscode      Set up VS Code configuration"
        echo "  --check-deps  Check for required development dependencies"
        echo "  --build       Configure and run initial build"
        echo "  --all         Run dependency check, build, and show editor instructions"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "For manual setup, see: dev-setup/README.md"
        ;;
    "")
        echo "Welcome to Nyros development setup!"
        echo ""
        echo "What would you like to set up?"
        echo ""
        echo "1) Complete setup (check deps + build + editor instructions)"
        echo "2) VS Code configuration only"
        echo "3) Check dependencies only"
        echo "4) Configure build system only"
        echo "5) Show editor setup instructions"
        echo ""
        read -p "Enter choice [1-5]: " -n 1 -r
        echo ""
        
        case $REPLY in
            1)
                check_dependencies
                echo ""
                initial_build
                echo ""
                show_editor_instructions
                ;;
            2)
                setup_vscode
                ;;
            3)
                check_dependencies
                ;;
            4)
                initial_build
                ;;
            5)
                show_editor_instructions
                ;;
            *)
                echo "Invalid choice. Use --help for usage information."
                exit 1
                ;;
        esac
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information."
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Setup complete! Happy coding! 🚀${NC}"
