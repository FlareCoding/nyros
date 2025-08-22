# =============================================================================
# Nyros Operating System - Root CMake Configuration
# =============================================================================
# This is the main entry point for the Nyros build system. It orchestrates
# the building of the kernel and creation of bootable images.
# =============================================================================

cmake_minimum_required(VERSION 3.20)

# For kernel development don't link with standard libraries
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

# Project definition with version information
project(nyros 
    VERSION 0.1.0
    DESCRIPTION "Nyros Operating System"
    LANGUAGES C CXX ASM)

# =============================================================================
# Build Options - User-configurable settings
# =============================================================================
option(NYROS_BUILD_TESTS "Build unit tests" OFF)
option(NYROS_ENABLE_LTO "Enable Link Time Optimization" OFF)
option(NYROS_ENABLE_SANITIZERS "Enable sanitizers (for host testing only)" OFF)
option(NYROS_VERBOSE_BUILD "Enable verbose build output" OFF)

# Architecture selection
set(NYROS_ARCH "x86_64" CACHE STRING "Target architecture")
set_property(CACHE NYROS_ARCH PROPERTY STRINGS "x86_64" "aarch64" "riscv64")

# Build type configuration
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Build type" FORCE)
endif()
set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS "Debug" "Release" "RelWithDebInfo")

# Optimization level
set(NYROS_OPTIMIZATION_LEVEL "2" CACHE STRING "Compiler optimization level (0-3)")
set_property(CACHE NYROS_OPTIMIZATION_LEVEL PROPERTY STRINGS "0" "1" "2" "3" "s" "z")

# =============================================================================
# CMake Module Path
# =============================================================================
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# =============================================================================
# Output Directories
# =============================================================================
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

# Kernel-specific output location
set(NYROS_KERNEL_OUTPUT_DIR ${CMAKE_BINARY_DIR}/kernel)
set(NYROS_IMAGE_OUTPUT_DIR ${CMAKE_BINARY_DIR}/image)

# =============================================================================
# Include Helper Modules
# =============================================================================
include(nyros-platform)     # Platform detection and configuration
include(nyros-toolchain)    # Toolchain setup and validation
include(nyros-options)      # Compiler and linker options
include(nyros-image)        # Image building utilities

# =============================================================================
# Global Compile Options
# =============================================================================
if(NYROS_VERBOSE_BUILD)
    set(CMAKE_VERBOSE_MAKEFILE ON)
endif()

# Export compile commands for IDE integration
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# =============================================================================
# Subdirectories
# =============================================================================
add_subdirectory(kernel)

# =============================================================================
# Image Building Targets
# =============================================================================
include(nyros-image-targets)

# =============================================================================
# Build Targets
# =============================================================================
# Build everything and create bootable image
add_custom_target(image ALL  # ALL makes this part of the default build
    DEPENDS nyros-kernel nyros-image-uefi
    COMMENT "Building complete Nyros image"
)

# Clean everything including images
add_custom_target(clean-all
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_BINARY_DIR}
    COMMENT "Cleaning all build artifacts"
)

# =============================================================================
# Status Messages
# =============================================================================
message(STATUS "")
message(STATUS "Nyros Configuration:")
message(STATUS "  Architecture:        ${NYROS_ARCH}")
message(STATUS "  Build Type:          ${CMAKE_BUILD_TYPE}")
message(STATUS "  Optimization Level:  ${NYROS_OPTIMIZATION_LEVEL}")
message(STATUS "  Build Tests:         ${NYROS_BUILD_TESTS}")
message(STATUS "  Enable LTO:          ${NYROS_ENABLE_LTO}")
message(STATUS "  C Compiler:          ${CMAKE_C_COMPILER}")
message(STATUS "  C++ Compiler:        ${CMAKE_CXX_COMPILER}")
message(STATUS "")
