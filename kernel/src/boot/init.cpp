#include <arch/arch_init.h>
#include <boot/multiboot2.h>
#include <iris/iris.h>
#include <serial/serial.h>

EXTERN_C
void init(unsigned int magic, void* mbi) {
    if (magic != multiboot::BOOTLOADER_MAGIC) {
        while (true) {
            asm volatile("hlt");
        }
    }

    (void)mbi;

    // Initialize early stage serial output
    serial::init_port(static_cast<uint16_t>(serial::port_base::COM1));

    // Initialize IRIS debug system on COM2
    iris::init();
    iris::emit(iris::EVENT_BOOT_START, 0, 0);

    // Hardware and arch-specific setup
    arch::arch_first_stage_init();

    // Idle loop
    while (true) {
        asm volatile("hlt");
    }
}
