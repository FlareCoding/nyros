# Nyros Operating System

A modern x86_64 kernel written in C++20, designed with debuggability and robustness in mind.

## 🚀 Quick Start for New Contributors

```bash
# 1. Clone the repository
git clone https://github.com/FlareCoding/nyros.git
cd nyros

# 2. Set up development environment (checks dependencies, configures build, shows editor setup)
./dev-setup/setup-dev-env.sh --all

# 3. Build and run
ninja -C build        # Build everything
./scripts/run.sh      # Run in QEMU
```

That's it! Your development environment is ready. 🎉

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+, Fedora 35+, Arch Linux)
- **Architecture**: x86_64 host system

### Required Dependencies
The setup script will check these automatically:

- **Compiler**: Clang 12+ or GCC 10+ (Clang recommended)
- **Build Tools**: CMake 3.20+, Ninja
- **Emulation**: QEMU (qemu-system-x86_64)
- **Debugging**: GDB 10+
- **Image Tools**: grub-mkrescue, xorriso, mtools

### Quick Install (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install -y \\
    clang ninja-build cmake \\
    qemu-system-x86 gdb \\
    grub-pc-bin grub2-common \\
    xorriso mtools
```

<details>
<summary>Other distributions (click to expand)</summary>

#### Fedora
```bash
sudo dnf install -y \\
    clang ninja-build cmake \\
    qemu-system-x86 gdb \\
    grub2-tools-extra grub2-pc-modules \\
    xorriso mtools
```

#### Arch Linux
```bash
sudo pacman -S \\
    clang ninja cmake \\
    qemu-arch-extra gdb \\
    grub xorriso mtools
```
</details>

## 🛠️ Development Workflow

### Initial Setup
```bash
# Configure for debug build with Clang (recommended)
./configure.sh --clang --debug

# Or configure for release build with GCC
./configure.sh --gcc --release
```

### Building
```bash
# Build everything (kernel + bootable image)
ninja -C build

# Build kernel only
ninja -C build nyros-kernel

# Clean build artifacts
ninja -C build clean
```

### Running & Testing
```bash
# Run in QEMU (GUI)
./scripts/run.sh

# Run in headless mode
./scripts/run.sh --headless

# Build and run in one command
./scripts/run.sh --build

# Run with GDB debugging support
./scripts/run.sh --debug
```

### Debugging
```bash
# Terminal 1: Start QEMU with GDB stub
./scripts/run.sh --debug

# Terminal 2: Connect GDB
./scripts/connect-gdb.sh
```

## 🎯 IDE/Editor Setup

### Automatic Setup
The project includes configurations for popular editors:

```bash
# Set up VS Code
./dev-setup/setup-dev-env.sh --vscode

# Check what editors are supported
./dev-setup/setup-dev-env.sh --help
```

### Manual Setup
All editors with clangd/LSP support work out of the box:
- **Configuration**: `.clangd` (language server)
- **Formatting**: `.clang-format` 
- **Universal settings**: `.editorconfig`
- **Build database**: `compile_commands.json` (auto-generated)

Supported editors include VS Code, Vim/Neovim, Emacs, CLion, and more.

## 🏗️ Project Structure

```
nyros/
├── kernel/                 # Kernel source code
│   ├── include/           # Header files
│   │   ├── arch/x86/      # x86_64 architecture-specific headers
│   │   ├── boot/          # Boot-related headers
│   │   ├── core/          # Core kernel headers
│   │   ├── ports/         # I/O port access
│   │   └── serial/        # Serial communication
│   └── src/               # Source files
│       ├── arch/x86/      # x86_64 implementation
│       ├── boot/          # Boot and initialization
│       ├── ports/         # I/O port implementation
│       └── serial/        # Serial driver
├── grub/                  # GRUB bootloader configuration
├── scripts/               # Build and utility scripts
├── dev-setup/             # Development environment templates
├── cmake/                 # CMake modules and configuration
└── ovmf/                  # UEFI firmware for QEMU
```

## 🔧 Configuration Options

### Build Types
```bash
# Debug build (default) - no optimization (-O0), optimized for debugging
./configure.sh --debug

# Release build - full optimization (-O2), optimized for performance
./configure.sh --release

# Override optimization level for any build type
./configure.sh --debug -O1      # Debug build with minimal optimization
./configure.sh --release -O0    # Release build with no optimization
```

### Compiler Selection
```bash
# Use Clang (recommended)
./configure.sh --clang

# Use GCC
./configure.sh --gcc
```

### Advanced Options
```bash
# Enable unit tests
./configure.sh --enable-tests

# Enable Link Time Optimization (release builds)
./configure.sh --enable-lto

# Verbose build output
./configure.sh --verbose

# Custom build directory
./configure.sh --build-dir my-build

# Use different generator
./configure.sh --generator "Unix Makefiles"
```

## 🚀 Current Features

- **Boot Process**: Multiboot2 compliant bootloader integration
- **Architecture**: x86_64 long mode with higher-half kernel mapping
- **Memory Management**: Basic paging setup with identity and higher-half mapping
- **I/O**: Serial port communication for early debugging
- **Build System**: Modern CMake-based build with Ninja
- **Development**: Comprehensive IDE support and debugging tools

## 🎯 Development Goals

- **Modern C++**: Leveraging C++20 features for kernel development
- **Performance**: Efficient memory management and optimized code paths
- **Maintainability**: Clean, well-documented, and modular codebase
- **Portability**: Designed for easy extension to other architectures
- **Developer Experience**: Excellent tooling and debugging support

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Set up your environment** using the quick start guide above
2. **Read the code** - explore the kernel structure and existing implementations
3. **Pick an issue** - check the GitHub issues for "good first issue" labels
4. **Make your changes** - follow the existing code style and conventions
5. **Test thoroughly** - ensure your changes build and run correctly
6. **Submit a PR** - provide a clear description of your changes

### Code Style
- **Formatting**: Code is automatically formatted with `.clang-format`
- **Naming**: Use descriptive names following existing conventions
- **Comments**: Document complex logic and architectural decisions
- **Commits**: Write clear, concise commit messages

### Testing Your Changes
```bash
# Build and test basic functionality
ninja -C build && ./scripts/run.sh

# Run local CI checks (same as GitHub Actions)
./scripts/run-ci-checks.sh

# Test specific aspects
./scripts/run-ci-checks.sh --static-analysis-only  # clang-tidy and cppcheck
./scripts/run-ci-checks.sh --build-tests-only      # Build matrix testing

# Test with different configurations
./configure.sh --gcc --release && ninja -C build
./configure.sh --clang --debug && ninja -C build

# Debug with GDB if needed
./scripts/run.sh --debug
```

### Code Quality Standards
We maintain high code quality through automated CI checks:

- **Static Analysis**: clang-tidy and cppcheck for bug detection
- **Build Matrix**: GCC 11-12, Clang 14-15 across Debug/Release
- **Optimization Testing**: -O0 through -O3 and -Os
- **Boot Testing**: QEMU integration tests

Install pre-commit hooks to catch issues early:
```bash
./dev-setup/setup-dev-env.sh --pre-commit-hook
```

Our CI uses industry-standard tools with pinned versions for reproducible builds.

## 📚 Resources

- **Kernel Development**: [OSDev Wiki](https://wiki.osdev.org/)
- **x86_64 Architecture**: [Intel Software Developer Manuals](https://software.intel.com/content/www/us/en/develop/articles/intel-sdm.html)
- **C++20 Features**: [cppreference.com](https://en.cppreference.com/)
- **CMake Documentation**: [cmake.org](https://cmake.org/documentation/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The OSDev community for excellent documentation and resources
- GRUB developers for the robust bootloader
- QEMU team for the excellent emulation platform
- Clang/LLVM and GCC teams for outstanding compiler toolchains

---

**Happy kernel hacking! 🚀**