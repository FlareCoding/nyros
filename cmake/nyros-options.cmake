# =============================================================================
# Compiler and Linker Options Module
# =============================================================================
# This module defines common compiler and linker flags used throughout the
# kernel build. It provides functions to apply consistent options.
# =============================================================================

# Create interface library for kernel compile options
add_library(nyros-kernel-options INTERFACE)

# Architecture-specific flags
if(NYROS_ARCH_X86_64)
    target_compile_options(nyros-kernel-options INTERFACE
        -m64
        -mno-red-zone      # Kernel can't use red zone
        -mno-sse           # No SSE in kernel (requires special handling)
        -mno-mmx           # No MMX in kernel
        -mcmodel=kernel    # Kernel memory model
        -fno-pic           # Disable Position Independent Code
        -fno-pie           # Disable Position Independent Executable
        -mno-80387         # No x87 floating point
        -mno-fp-ret-in-387 # Don't return FP values in x87 registers
    )
    
    # Ensure proper stack alignment for Clang
    if(NYROS_USING_CLANG)
        target_compile_options(nyros-kernel-options INTERFACE
            -mstack-alignment=16
        )
    endif()
endif()

# Common kernel flags
target_compile_options(nyros-kernel-options INTERFACE
    # Freestanding environment
    -ffreestanding
    -nostdlib
    -fno-builtin
    
    # Stack protection
    -fno-stack-protector
    -fno-stack-clash-protection
    
    # Code generation
    -fno-omit-frame-pointer
    -fno-optimize-sibling-calls
    
    # Optimization
    -O${NYROS_OPTIMIZATION_LEVEL}
    
    # Security
    -fno-strict-overflow
    -fno-delete-null-pointer-checks
    
    # Warnings
    -Wall
    -Wextra
    -Werror
    -Wno-unused-parameter
    -Wno-unused-variable
    -Wno-unused-but-set-variable
    -Wframe-larger-than=2048
    -Wimplicit-fallthrough
)

# C++ specific flags
target_compile_options(nyros-kernel-options INTERFACE
    $<$<COMPILE_LANGUAGE:CXX>:
        -fno-exceptions
        -fno-rtti
        -fno-threadsafe-statics
        -Wno-unused-const-variable
    >
)

# Debug flags
if(NYROS_USING_CLANG)
    # Clang: Use DWARF version 4 for better compatibility with GNU binutils
    target_compile_options(nyros-kernel-options INTERFACE
        $<$<CONFIG:Debug>:
            -g
            -gdwarf-4
            -DDEBUG
            -DNYROS_DEBUG
        >
    )
else()
    # GCC: Use native debug format
    target_compile_options(nyros-kernel-options INTERFACE
        $<$<CONFIG:Debug>:
            -g3
            -ggdb
            -DDEBUG
            -DNYROS_DEBUG
        >
    )
endif()

# Release flags
target_compile_options(nyros-kernel-options INTERFACE
    $<$<CONFIG:Release>:
        -DNDEBUG
        -ffunction-sections
        -fdata-sections
    >
)

# Clang-specific flags
if(NYROS_USING_CLANG)
    target_compile_options(nyros-kernel-options INTERFACE
        -Wno-gnu-designator
        -Wno-unused-command-line-argument
        -mno-sse3
        -mno-ssse3
        -mno-sse4.1
        -mno-sse4.2
        -mno-avx
        -mno-avx2
        -fno-vectorize
        -fno-slp-vectorize
    )
    
    # Clang static analyzer
    if(NYROS_ENABLE_STATIC_ANALYSIS)
        target_compile_options(nyros-kernel-options INTERFACE
            --analyze
        )
    endif()
endif()

# GCC-specific flags
if(NYROS_USING_GCC)
    target_compile_options(nyros-kernel-options INTERFACE
        -Wno-stringop-truncation
        -Wno-stringop-overflow
        -Wno-restrict
        -Wno-maybe-uninitialized
        -fno-reorder-blocks
        -fno-ipa-cp-clone
        -fno-partial-inlining
        -fconserve-stack
        -fno-allow-store-data-races
    )
endif()

# LTO support
if(NYROS_ENABLE_LTO)
    target_compile_options(nyros-kernel-options INTERFACE -flto)
    target_link_options(nyros-kernel-options INTERFACE -flto)
endif()

# Function to apply kernel options to a target
function(nyros_apply_kernel_options target)
    target_link_libraries(${target} PRIVATE nyros-kernel-options)
    
    # Set include directories
    target_include_directories(${target} PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/include/core
    )
    
    # Add linker options
    target_link_options(${target} PRIVATE
        -nostdlib
        -no-pie
        -Wl,--build-id=none
    )
endfunction()

# Linker script handling function
function(nyros_set_linker_script target script_path)
    if(NYROS_USING_CLANG)
        target_link_options(${target} PRIVATE
            -T ${script_path}
            -nostdlib
            -no-pie
            ${NYROS_LINKER_FLAGS}
        )
    else()
        target_link_options(${target} PRIVATE
            -T ${script_path}
            -nostdlib
            -no-pie
        )
    endif()
    
    # Make sure linker script is a dependency
    set_target_properties(${target} PROPERTIES
        LINK_DEPENDS ${script_path}
    )
endfunction()
