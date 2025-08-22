# Nyros Operating System

Nyros is a modern x86_64 operating system built from scratch with a focus on clean architecture and modern development practices.

## Prerequisites

Install the required dependencies on Ubuntu/Debian:

```bash
sudo apt-get install -y \
    build-essential cmake ninja-build \
    grub-pc-bin grub-efi-amd64-bin \
    xorriso mtools \
    qemu-system-x86 ovmf
```

## Building

### First Time Setup

```bash
# Configure the build system (one time only)
./configure.sh

# Or configure with specific options
./configure.sh --release        # Release build
./configure.sh --clang          # Use Clang instead of GCC
./configure.sh --help           # See all options
```

### Building

After configuration, use ninja:

```bash
ninja -C build              # Build everything (kernel + bootable image)
ninja -C build nyros-kernel # Build kernel only
ninja -C build clean        # Clean build artifacts
ninja -C build help         # Show all targets
```

### Reconfiguring

```bash
# Change build configuration
./configure.sh --release    # Switch to release mode
./configure.sh --debug      # Switch back to debug mode
rm -rf build                # Remove entire build directory
```

## Running

Run Nyros in QEMU (with proper terminal I/O):

```bash
# Run the OS
./scripts/run.sh            # Run existing image
./scripts/run.sh --build    # Build and run
./scripts/run.sh --help     # See all options

# The terminal becomes the QEMU monitor
# Use Ctrl-A H for help, Ctrl-A X to exit
```

## Debugging

Debug the kernel with GDB:

```bash
# Terminal 1: Start QEMU in debug mode
./scripts/run.sh --debug

# Terminal 2: Connect GDB
./scripts/connect-gdb.sh

# GDB will connect and set breakpoints at kernel entry points
# Use 'c' to continue, 'si' to step through instructions
```

## Project Structure

```
nyros/
├── kernel/           # Kernel source code
│   ├── include/      # Header files
│   ├── src/          # Source files
│   └── nyros.ld      # Linker script
├── cmake/            # CMake modules
├── scripts/          # Build and run scripts
├── grub/             # GRUB configuration and fonts
└── ovmf/             # UEFI firmware for testing
```

## Build Configuration

Key CMake options:
- `CMAKE_BUILD_TYPE`: Debug/Release (default: Debug)
- `NYROS_OPTIMIZATION_LEVEL`: 0-3, s, z (default: 2)
- `NYROS_BUILD_TESTS`: Build unit tests (default: OFF)
- `NYROS_ARCH`: Target architecture (default: x86_64)

## Features

Current features:
- x86_64 architecture support
- UEFI/BIOS hybrid boot via GRUB2
- Higher-half kernel (0xffffffff80000000)
- Serial port driver for console output
- Modern CMake/Ninja build system

## License

See LICENSE file for details.
