# =============================================================================
# Image Building Utilities Module
# =============================================================================
# This module provides utilities for creating bootable disk images.
# It handles UEFI/BIOS image creation with GRUB bootloader.
# =============================================================================

# Check if we can build images
if(NOT NYROS_CAN_BUILD_IMAGE)
    message(WARNING "Image building is disabled due to missing tools")
    return()
endif()

# Find OVMF firmware files for UEFI testing
if(NYROS_UEFI_BOOT)
    find_file(OVMF_CODE 
        NAMES OVMF_CODE.fd
        PATHS 
            ${CMAKE_SOURCE_DIR}/ovmf
            /usr/share/ovmf
            /usr/share/qemu
            /usr/share/edk2/ovmf
    )
    
    find_file(OVMF_VARS
        NAMES OVMF_VARS.fd
        PATHS 
            ${CMAKE_SOURCE_DIR}/ovmf
            /usr/share/ovmf
            /usr/share/qemu
            /usr/share/edk2/ovmf
    )
    
    if(NOT OVMF_CODE OR NOT OVMF_VARS)
        message(WARNING "OVMF firmware not found - UEFI testing may not work")
        # Use the local copies if system ones not found
        set(OVMF_CODE "${CMAKE_SOURCE_DIR}/ovmf/OVMF_CODE.fd")
        set(OVMF_VARS "${CMAKE_SOURCE_DIR}/ovmf/OVMF_VARS.fd")
    endif()
endif()

# Function to create GRUB configuration
function(nyros_create_grub_config output_file)
    file(WRITE ${output_file} "
set timeout=5
set default=0

# Try loading a font for graphical mode
if loadfont /boot/grub/fonts/unicode.pf2; then
    set gfxmode=3840x2160x32,2560x1440x32,1920x1080x32,auto
    set gfxpayload=keep
    terminal_output console gfxterm
else
    echo \"Failed to load font. Falling back to default text mode.\"
fi

menuentry \"Nyros ${PROJECT_VERSION}\" {
    multiboot2 /boot/nyros-kernel
    boot
}

menuentry \"Nyros ${PROJECT_VERSION} (Recovery)\" {
    multiboot2 /boot/nyros-kernel recovery=true
    boot
}
")
endfunction()

# Function to copy GRUB fonts
function(nyros_copy_grub_fonts target_dir)
    file(MAKE_DIRECTORY ${target_dir}/fonts)
    
    # Try to find and copy Unicode font
    find_file(GRUB_UNICODE_FONT
        NAMES unicode.pf2
        PATHS
            ${CMAKE_SOURCE_DIR}/grub/fonts
            /usr/share/grub
            /usr/share/grub2/themes
            /boot/grub/fonts
            /boot/grub2/fonts
    )
    
    if(GRUB_UNICODE_FONT)
        file(COPY ${GRUB_UNICODE_FONT} DESTINATION ${target_dir}/fonts/)
    endif()
    
    # Copy DejaVu font if it exists
    if(EXISTS ${CMAKE_SOURCE_DIR}/grub/fonts/DejaVuSansMono.pf2)
        file(COPY ${CMAKE_SOURCE_DIR}/grub/fonts/DejaVuSansMono.pf2 
             DESTINATION ${target_dir}/fonts/)
    endif()
endfunction()

# Path configurations
set(NYROS_GRUB_CFG ${CMAKE_BINARY_DIR}/grub/grub.cfg)
set(NYROS_IMAGE_FILE ${NYROS_IMAGE_OUTPUT_DIR}/nyros.img)
