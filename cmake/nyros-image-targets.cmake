# =============================================================================
# Image Building Targets Module
# =============================================================================
# This module creates the actual CMake targets for building bootable images.
# Uses grub-mkrescue to create hybrid UEFI/BIOS bootable images without sudo.
# =============================================================================

if(NOT NYROS_CAN_BUILD_IMAGE)
    return()
endif()

# Create output directories
file(MAKE_DIRECTORY ${NYROS_IMAGE_OUTPUT_DIR})
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/grub)
file(MAKE_DIRECTORY ${CMAKE_BINARY_DIR}/iso-root)

# Generate GRUB configuration
nyros_create_grub_config(${NYROS_GRUB_CFG})

# Copy GRUB fonts
nyros_copy_grub_fonts(${CMAKE_BINARY_DIR}/grub)

# Find grub-mkrescue
find_program(GRUB_MKRESCUE grub-mkrescue grub2-mkrescue)

if(NOT GRUB_MKRESCUE)
    message(FATAL_ERROR "grub-mkrescue not found. Please install GRUB tools.")
endif()

# Create bootable image using grub-mkrescue (no sudo required)
add_custom_target(nyros-image-uefi
    COMMENT "Creating bootable UEFI/BIOS hybrid image"
    
    # Prepare ISO root directory structure
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/iso-root/boot/grub
    COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/iso-root/boot/grub/fonts
    
    # Copy kernel
    COMMAND ${CMAKE_COMMAND} -E copy 
        ${CMAKE_BINARY_DIR}/kernel/nyros-kernel 
        ${CMAKE_BINARY_DIR}/iso-root/boot/nyros-kernel
    
    # Copy GRUB configuration
    COMMAND ${CMAKE_COMMAND} -E copy 
        ${NYROS_GRUB_CFG} 
        ${CMAKE_BINARY_DIR}/iso-root/boot/grub/grub.cfg
    
    # Copy fonts if they exist
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_BINARY_DIR}/grub/fonts
        ${CMAKE_BINARY_DIR}/iso-root/boot/grub/fonts
    
    # Create hybrid UEFI/BIOS bootable image
    COMMAND ${GRUB_MKRESCUE}
        -o ${NYROS_IMAGE_OUTPUT_DIR}/nyros.img
        ${CMAKE_BINARY_DIR}/iso-root
        --
        -volid NYROS
        
    DEPENDS nyros-kernel
    BYPRODUCTS ${NYROS_IMAGE_OUTPUT_DIR}/nyros.img
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
)

# Create ISO image (same output, different name for compatibility)
add_custom_target(nyros-iso
    COMMENT "Creating ISO image"
    COMMAND ${CMAKE_COMMAND} -E copy
        ${NYROS_IMAGE_OUTPUT_DIR}/nyros.img
        ${NYROS_IMAGE_OUTPUT_DIR}/nyros.iso
    DEPENDS nyros-image-uefi
    BYPRODUCTS ${NYROS_IMAGE_OUTPUT_DIR}/nyros.iso
)

# Install target for kernel binary
install(TARGETS nyros-kernel
    RUNTIME DESTINATION boot
    COMPONENT kernel
)

# Install GRUB configuration
install(FILES ${NYROS_GRUB_CFG}
    DESTINATION boot/grub
    COMPONENT bootloader
)

# Create a target to clean images
add_custom_target(clean-images
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${NYROS_IMAGE_OUTPUT_DIR}
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_BINARY_DIR}/iso-root
    COMMENT "Cleaning disk images"
)