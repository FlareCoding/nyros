# =============================================================================
# Nyros GDB Configuration
# =============================================================================
# Custom GDB settings for debugging the Nyros kernel
# =============================================================================

# Display settings
set disassembly-flavor intel
set print pretty on
set print array on
set print array-indexes on
set pagination off

# Number display (use hex for addresses, decimal for data)
set output-radix 10
set input-radix 10

# TUI (Text User Interface) layout
# Creates a custom layout with registers, source, assembly, and command windows
tui new-layout nyros-layout regs 1 {src 2 asm 1} 2 cmd 1 status 0
layout nyros-layout

# Architecture settings
set architecture i386:x86-64

# Kernel-specific settings
set confirm off
set verbose off
set print symbol-filename on

# Useful macros for kernel debugging
define print-multiboot
    echo Multiboot magic: 
    x/x $rdi
    echo Multiboot info: 
    x/x $rsi
end

define print-stack
    echo Stack dump:\n
    x/32xg $rsp
end

define print-gdt
    echo GDT entries:\n
    x/16xg $gdtr.base
end

define print-idt
    echo IDT entries:\n
    x/32xg $idtr.base
end

define print-cr
    echo Control registers:\n
    printf "CR0: 0x%016lx\n", $cr0
    printf "CR2: 0x%016lx\n", $cr2
    printf "CR3: 0x%016lx\n", $cr3
    printf "CR4: 0x%016lx\n", $cr4
end

# Breakpoint helpers
define break-kernel-init
    break init
end

# Print help on connection
echo \n
echo Nyros GDB Debug Session\n
echo =======================\n
echo \n
echo Custom commands:\n
echo   print-multiboot  - Show multiboot parameters\n
echo   print-stack      - Dump stack contents\n
echo   print-gdt        - Show GDT entries\n
echo   print-idt        - Show IDT entries\n
echo   print-cr         - Show control registers\n
echo \n