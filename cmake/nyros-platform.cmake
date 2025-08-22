# =============================================================================
# Platform Detection and Configuration Module
# =============================================================================
# This module detects the host platform and configures platform-specific
# settings. It ensures we're building on a supported system and sets up
# platform-specific variables.
# =============================================================================

# Detect host system
if(CMAKE_HOST_SYSTEM_NAME STREQUAL "Linux")
    set(NYROS_HOST_LINUX TRUE)
elseif(CMAKE_HOST_SYSTEM_NAME STREQUAL "Darwin")
    set(NYROS_HOST_MACOS TRUE)
elseif(CMAKE_HOST_SYSTEM_NAME STREQUAL "Windows")
    set(NYROS_HOST_WINDOWS TRUE)
else()
    message(FATAL_ERROR "Unsupported host platform: ${CMAKE_HOST_SYSTEM_NAME}")
endif()

# Architecture-specific settings
if(NYROS_ARCH STREQUAL "x86_64")
    set(NYROS_ARCH_X86_64 TRUE)
    set(NYROS_ARCH_BITS 64)
    set(NYROS_KERNEL_LINK_ADDRESS "0xffffffff80000000")
    set(NYROS_KERNEL_PHYSICAL_LOAD "0x100000")
    add_compile_definitions(ARCH_X86_64)
elseif(NYROS_ARCH STREQUAL "aarch64")
    set(NYROS_ARCH_AARCH64 TRUE)
    set(NYROS_ARCH_BITS 64)
    set(NYROS_KERNEL_LINK_ADDRESS "0xffff000000000000")
    add_compile_definitions(ARCH_AARCH64)
elseif(NYROS_ARCH STREQUAL "riscv64")
    set(NYROS_ARCH_RISCV64 TRUE)
    set(NYROS_ARCH_BITS 64)
    set(NYROS_KERNEL_LINK_ADDRESS "0xffffffff80000000")
    add_compile_definitions(ARCH_RISCV64)
else()
    message(FATAL_ERROR "Unsupported architecture: ${NYROS_ARCH}")
endif()

# UEFI/BIOS settings
set(NYROS_BOOT_PROTOCOL "UEFI" CACHE STRING "Boot protocol (UEFI or BIOS)")
set_property(CACHE NYROS_BOOT_PROTOCOL PROPERTY STRINGS "UEFI" "BIOS")

if(NYROS_BOOT_PROTOCOL STREQUAL "UEFI")
    set(NYROS_UEFI_BOOT TRUE)
    if(NYROS_ARCH_X86_64)
        set(NYROS_EFI_ARCH "x86_64")
        set(NYROS_GRUB_TARGET "x86_64-efi")
    endif()
endif()

# Find required tools
find_program(GRUB_MKRESCUE grub-mkrescue grub2-mkrescue)
find_program(XORRISO xorriso)
find_program(MFORMAT mformat)
find_program(QEMU_EXECUTABLE qemu-system-${NYROS_ARCH} qemu-system-x86_64)

# Validate required tools for image building
if(NOT GRUB_MKRESCUE)
    message(WARNING "grub-mkrescue not found - image building will not be available")
    message(WARNING "Please install: grub-pc-bin grub-efi-amd64-bin")
    set(NYROS_CAN_BUILD_IMAGE FALSE)
elseif(NOT XORRISO)
    message(WARNING "xorriso not found - image building will not be available")
    message(WARNING "Please install: xorriso")
    set(NYROS_CAN_BUILD_IMAGE FALSE)
elseif(NOT MFORMAT)
    message(WARNING "mformat (mtools) not found - image building will not be available")
    message(WARNING "Please install: mtools")
    set(NYROS_CAN_BUILD_IMAGE FALSE)
else()
    set(NYROS_CAN_BUILD_IMAGE TRUE)
endif()

# QEMU configuration
set(NYROS_QEMU_MEMORY "4G" CACHE STRING "QEMU memory allocation")
set(NYROS_QEMU_CPUS "4" CACHE STRING "QEMU CPU count")
set(NYROS_QEMU_MACHINE "q35" CACHE STRING "QEMU machine type")

# Image configuration
set(NYROS_IMAGE_SIZE_MB "64" CACHE STRING "Total image size in MB")
set(NYROS_ESP_SIZE_MB "48" CACHE STRING "EFI System Partition size in MB")
