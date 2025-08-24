# Development Environment Setup

This directory contains templates and tools for setting up your development environment for Nyros kernel development.

## Quick Start

For new contributors, simply run:

```bash
./dev-setup/setup-dev-env.sh --all
```

This will:
- Check for all required dependencies
- Configure the build system
- Show instructions for your preferred editor

## Available Editor Configurations

### 🔧 Universal (Language-Agnostic)
These files are already in the repository root and work with any editor:

- **`.clangd`** - Language server configuration
- **`.editorconfig`** - Basic editor settings
- **`.clang-format`** - Code formatting rules
- **`compile_commands.json`** - Auto-generated compilation database

### 📝 Editor-Specific Templates

#### VS Code
```bash
./dev-setup/setup-dev-env.sh --vscode
```

Or manually copy:
```bash
cp -r dev-setup/vscode/ .vscode/
```

**Included configuration:**
- IntelliSense optimized for kernel development
- Custom build tasks
- Debugging configuration
- File associations for assembly and linker scripts

#### Vim/Neovim
Install a clangd plugin for your Vim distribution:
- **coc-clangd** (for coc.nvim)
- **vim-lsp** with clangd
- **nvim-lspconfig** (for Neovim)

The `.clangd` file in the repository root provides all necessary configuration.

#### Emacs
Install and configure:
- `lsp-mode`
- `lsp-clangd`

The `.clangd` file provides the configuration.

#### CLion / JetBrains IDEs
Simply import the project as a CMake project. The IDE will automatically use the CMake configuration and `compile_commands.json`.

## Development Dependencies

### Required Tools
- **Compiler**: Clang or GCC (Clang recommended)
- **Build System**: CMake 3.20+, Ninja
- **Static Analysis**: clang-tidy, cppcheck
- **Emulation**: QEMU (qemu-system-x86_64)
- **Debugging**: GDB
- **Image Creation**: grub-mkrescue, xorriso, mtools

### Installation Commands

#### Ubuntu/Debian
```bash
sudo apt update && sudo apt install -y \
    clang ninja-build cmake \
    clang-tidy cppcheck \
    qemu-system-x86 gdb \
    grub-pc-bin grub2-common \
    xorriso mtools
```

#### Fedora
```bash
sudo dnf install -y \
    clang ninja-build cmake \
    clang-tools-extra cppcheck \
    qemu-system-x86 gdb \
    grub2-tools-extra grub2-pc-modules \
    xorriso mtools
```

#### Arch Linux
```bash
sudo pacman -S \
    clang ninja cmake \
    clang cppcheck \
    qemu-arch-extra gdb \
    grub xorriso mtools
```

### Optional: Latest Static Analysis Tools

For enhanced static analysis (more comprehensive checks), you can install the latest clang-tidy from the LLVM repository:

```bash
# Add LLVM repository (Ubuntu/Debian)
wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | sudo apt-key add -
sudo add-apt-repository "deb http://apt.llvm.org/jammy/ llvm-toolchain-jammy main"
sudo apt update

# Install latest clang-tidy
sudo apt install clang-tidy-22

# Set as default
sudo update-alternatives --install /usr/bin/clang-tidy clang-tidy /usr/bin/clang-tidy-22 100
```

## First Build

After setting up dependencies:

```bash
# Configure build system
./configure.sh --clang --debug

# Build everything
ninja -C build

# Run in QEMU
./scripts/run.sh
```

## Troubleshooting

### IntelliSense/LSP Issues
1. Ensure you've built the project at least once: `ninja -C build`
2. Check that `compile_commands.json` exists in the root directory
3. Restart your editor/LSP server
4. For VS Code: Reload window (Ctrl+Shift+P → "Developer: Reload Window")

### Missing Dependencies
Run the dependency checker:
```bash
./dev-setup/setup-dev-env.sh --check-deps
```

### Build Issues
- Ensure you have all required dependencies installed
- Try cleaning and reconfiguring: `ninja -C build clean && ./configure.sh --clang`
- Check that your compiler versions are supported (see main README)

## Adding New Editor Support

To add support for a new editor:

1. Create a directory: `dev-setup/your-editor/`
2. Add configuration files specific to that editor
3. Update `setup-dev-env.sh` to include setup logic
4. Update this README with installation instructions

## File Structure

```
dev-setup/
├── README.md              # This file
├── setup-dev-env.sh       # Automated setup script
└── vscode/               # VS Code configuration template
    ├── settings.json
    └── c_cpp_properties.json
```

## Best Practices

- **Universal first**: Use language-agnostic tools (`.clangd`, `.editorconfig`) when possible
- **Templates for specifics**: Keep editor-specific configs as optional templates
- **Automation**: Provide scripts for common setup tasks
- **Documentation**: Clear instructions for manual setup
- **Compatibility**: Support multiple editors and operating systems
