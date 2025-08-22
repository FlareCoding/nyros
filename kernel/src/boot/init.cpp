#include <serial/serial.h>
#include <boot/multiboot2.h>

EXTERN_C
void init(unsigned int magic, void* mbi) {
    if (magic != MULTIBOOT2_BOOTLOADER_MAGIC) {
        while (true) { asm volatile ("hlt"); }
    }

    (void)mbi;

    // Initialize early stage serial output
    serial::init_port(SERIAL_PORT_BASE_COM1);

    serial::write(SERIAL_PORT_BASE_COM1, "Hello, world!");

    // Idle loop
    while (true) {
        asm volatile ("hlt");
    }
}
