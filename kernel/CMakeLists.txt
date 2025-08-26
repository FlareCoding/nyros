# =============================================================================
# Nyros Kernel CMake Configuration
# =============================================================================
# This file builds the Nyros kernel binary. It compiles all kernel sources
# and links them into a single ELF executable suitable for multiboot2 loading.
# =============================================================================

cmake_minimum_required(VERSION 3.20)
project(nyros-kernel LANGUAGES C CXX ASM)

# Treat .h files as C++ headers
file(GLOB_RECURSE ALL_HEADERS "include/**/*.h")
set_source_files_properties(${ALL_HEADERS} PROPERTIES LANGUAGE CXX)

# =============================================================================
# Source Files Collection
# =============================================================================
# Collect all source files based on architecture
set(KERNEL_SOURCES)
set(KERNEL_ASM_SOURCES)

# Common sources (architecture-independent)
file(GLOB_RECURSE COMMON_SOURCES
    src/boot/*.cpp
    src/serial/*.cpp
    src/ports/*.cpp
    src/memory/*.cpp
    src/iris/*.cpp
)

# Architecture-specific sources
if(NYROS_ARCH_X86_64)
    file(GLOB_RECURSE ARCH_SOURCES
        src/arch/*.cpp
        src/arch/x86/*.cpp
        src/arch/x86/gdt/*.cpp
    )
    
    file(GLOB_RECURSE ARCH_ASM_SOURCES
        src/arch/x86/*.S
        src/arch/x86/asm/*.S
        src/arch/x86/boot/*.S
    )
    
    set(KERNEL_LINKER_SCRIPT ${CMAKE_CURRENT_SOURCE_DIR}/nyros.ld)
endif()

# Combine all sources
list(APPEND KERNEL_SOURCES ${COMMON_SOURCES} ${ARCH_SOURCES})
list(APPEND KERNEL_ASM_SOURCES ${ARCH_ASM_SOURCES})

# =============================================================================
# Kernel Executable Target
# =============================================================================
add_executable(nyros-kernel
    ${KERNEL_SOURCES}
    ${KERNEL_ASM_SOURCES}
)

# Apply kernel compile options
nyros_apply_kernel_options(nyros-kernel)

# Additional include directories specific to kernel
target_include_directories(nyros-kernel PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include/core
    ${CMAKE_CURRENT_SOURCE_DIR}/include/arch/${NYROS_ARCH}
)

# Architecture-specific definitions
target_compile_definitions(nyros-kernel PRIVATE
    KERNEL_VERSION="${PROJECT_VERSION}"
    $<$<BOOL:${NYROS_BUILD_TESTS}>:BUILD_UNIT_TESTS>
)

# Set up linker script
if(EXISTS ${KERNEL_LINKER_SCRIPT})
    nyros_set_linker_script(nyros-kernel ${KERNEL_LINKER_SCRIPT})
else()
    message(FATAL_ERROR "Linker script not found: ${KERNEL_LINKER_SCRIPT}")
endif()

# Set output location
set_target_properties(nyros-kernel PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/kernel
    OUTPUT_NAME nyros-kernel
)

# =============================================================================
# Post-build Commands
# =============================================================================
# Generate kernel symbols map
add_custom_command(TARGET nyros-kernel POST_BUILD
    COMMAND ${NYROS_NM} -n $<TARGET_FILE:nyros-kernel> > ${CMAKE_BINARY_DIR}/kernel/nyros-kernel.map
    COMMENT "Generating kernel symbol map"
)

# Generate disassembly for debugging
if(NYROS_USING_CLANG)
    add_custom_command(TARGET nyros-kernel POST_BUILD
        COMMAND ${NYROS_OBJDUMP} -d $<TARGET_FILE:nyros-kernel> > ${CMAKE_BINARY_DIR}/kernel/nyros-kernel.asm 2>/dev/null || true
        COMMENT "Generating kernel disassembly"
    )
else()
    add_custom_command(TARGET nyros-kernel POST_BUILD
        COMMAND ${NYROS_OBJDUMP} -d $<TARGET_FILE:nyros-kernel> > ${CMAKE_BINARY_DIR}/kernel/nyros-kernel.asm
        COMMENT "Generating kernel disassembly"
    )
endif()

# Show kernel size
add_custom_command(TARGET nyros-kernel POST_BUILD
    COMMAND ${NYROS_SIZE} $<TARGET_FILE:nyros-kernel>
    COMMENT "Kernel size information"
)

# =============================================================================
# Testing Support
# =============================================================================
if(NYROS_BUILD_TESTS)
    # Collect test files
    file(GLOB_RECURSE TEST_SOURCES src/*.test.cpp)
    
    if(TEST_SOURCES)
        # Create test runner target
        add_executable(nyros-kernel-tests
            ${TEST_SOURCES}
            ${KERNEL_SOURCES}
            ${KERNEL_ASM_SOURCES}
        )
        
        nyros_apply_kernel_options(nyros-kernel-tests)
        target_compile_definitions(nyros-kernel-tests PRIVATE BUILD_UNIT_TESTS RUN_TESTS)
        nyros_set_linker_script(nyros-kernel-tests ${KERNEL_LINKER_SCRIPT})
    endif()
endif()

# =============================================================================
# Installation
# =============================================================================
install(TARGETS nyros-kernel
    RUNTIME DESTINATION kernel
    COMPONENT kernel
)

install(FILES ${CMAKE_BINARY_DIR}/kernel/nyros-kernel.map
    DESTINATION kernel
    COMPONENT debug
    OPTIONAL
)

# =============================================================================
# Kernel Module Support (Future)
# =============================================================================
# This section will handle loadable kernel modules when implemented
# add_subdirectory(modules)
