# =============================================================================
# Toolchain Setup and Validation Module
# =============================================================================
# This module configures the compiler toolchain for kernel development.
# It sets up cross-compilation settings and validates compiler capabilities.
# =============================================================================

# Kernel is freestanding - no standard library
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR ${NYROS_ARCH})

# Prefer Clang if available, fall back to GCC
if(NOT DEFINED CMAKE_C_COMPILER)
    find_program(CLANG_COMPILER clang)
    find_program(GCC_COMPILER gcc)
    
    if(CLANG_COMPILER)
        set(CMAKE_C_COMPILER ${CLANG_COMPILER})
        set(CMAKE_CXX_COMPILER clang++)
        set(NYROS_USING_CLANG TRUE)
    elseif(GCC_COMPILER)
        set(CMAKE_C_COMPILER ${GCC_COMPILER})
        set(CMAKE_CXX_COMPILER g++)
        set(NYROS_USING_GCC TRUE)
    else()
        message(FATAL_ERROR "No suitable compiler found (tried clang and gcc)")
    endif()
endif()

# Detect compiler type if explicitly specified
if(CMAKE_C_COMPILER MATCHES ".*clang.*")
    set(NYROS_USING_CLANG TRUE)
elseif(CMAKE_C_COMPILER MATCHES ".*gcc.*")
    set(NYROS_USING_GCC TRUE)
endif()

# Set assembler
if(NYROS_USING_CLANG)
    set(CMAKE_ASM_COMPILER ${CMAKE_C_COMPILER})
else()
    set(CMAKE_ASM_COMPILER ${CMAKE_C_COMPILER})
endif()

# Linker configuration
if(NYROS_USING_CLANG)
    # Use LLD if available, but for kernel we'll stick with GNU ld for compatibility
    # LLD has issues with some kernel-specific linking requirements
    find_program(GNU_LD ld)
    if(GNU_LD)
        set(CMAKE_LINKER ${GNU_LD})
        set(NYROS_LINKER_FLAGS "-fuse-ld=bfd")
    endif()
else()
    # Use GNU ld
    find_program(GNU_LD ld)
    if(GNU_LD)
        set(CMAKE_LINKER ${GNU_LD})
    endif()
endif()

# Check compiler version
if(NYROS_USING_CLANG)
    if(CMAKE_CXX_COMPILER_VERSION VERSION_LESS "12.0")
        message(WARNING "Clang version ${CMAKE_CXX_COMPILER_VERSION} is old. Recommend 12.0+")
    endif()
elseif(NYROS_USING_GCC)
    if(CMAKE_CXX_COMPILER_VERSION VERSION_LESS "10.0")
        message(WARNING "GCC version ${CMAKE_CXX_COMPILER_VERSION} is old. Recommend 10.0+")
    endif()
endif()

# Kernel-specific toolchain settings
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Disable standard libraries for kernel
set(CMAKE_C_FLAGS_INIT "-ffreestanding -nostdlib")
set(CMAKE_CXX_FLAGS_INIT "-ffreestanding -nostdlib -fno-exceptions -fno-rtti")
set(CMAKE_EXE_LINKER_FLAGS_INIT "-nostdlib")

# Tools for building
find_program(NYROS_OBJCOPY objcopy)
find_program(NYROS_OBJDUMP objdump)
find_program(NYROS_NM nm)
find_program(NYROS_SIZE size)
find_program(NYROS_STRIP strip)

if(NOT NYROS_OBJCOPY)
    message(WARNING "objcopy not found - some build features may not work")
endif()
