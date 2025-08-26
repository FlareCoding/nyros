#include <arch/arch_init.h>
#include <arch/x86/gdt/gdt.h>

uint8_t g_default_bsp_system_stack[0x1000 * 4];

namespace arch {
void arch_first_stage_init() {
    // Setup kernel stack
    uint64_t bsp_system_stack_top = reinterpret_cast<uint64_t>(g_default_bsp_system_stack) +
                                    sizeof(g_default_bsp_system_stack) - 0x10;

    // Setup the GDT with userspace support
    x86::init_gdt(0, bsp_system_stack_top);
}

void arch_second_stage_init() {
}
} // namespace arch
