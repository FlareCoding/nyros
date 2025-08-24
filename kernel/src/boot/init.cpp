#include <boot/multiboot2.h>
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

    serial::write(static_cast<uint16_t>(serial::port_base::COM1), "Hello, world!");

    // Idle loop
    while (true) {
        asm volatile("hlt");
    }
}
