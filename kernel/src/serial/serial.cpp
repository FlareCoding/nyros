#include <serial/serial.h>

namespace serial {

uint16_t g_kernel_uart_port = static_cast<uint16_t>(port_base::COM1);
uint16_t g_kernel_gdb_stub_uart_port = static_cast<uint16_t>(port_base::COM2);

void init_port(uint16_t port, baud_rate_divisor baud_divisor) {
    // Disable all interrupts
    outb(interrupt_enable_port_offset(port), 0x00);

    // Configure the baud rate
    set_baud_rate(port, baud_divisor);

    // Configure line control: 8 bits, no parity, 1 stop bit
    outb(line_command_port_offset(port),
         static_cast<uint8_t>(line_control_flags::EIGHT_BITS_NO_PARITY_ONE_STOP));

    // Enable FIFO, clear TX/RX queues, set interrupt trigger level to 14 bytes
    uint8_t fifo_config = static_cast<uint8_t>(fifo_control_flags::ENABLE_FIFO) |
                          static_cast<uint8_t>(fifo_control_flags::CLEAR_RECEIVE_FIFO) |
                          static_cast<uint8_t>(fifo_control_flags::CLEAR_TRANSMIT_FIFO) |
                          static_cast<uint8_t>(fifo_control_flags::TRIGGER_14_BYTES);
    outb(fifo_command_port_offset(port), fifo_config);

    // Set RTS, DSR, and OUT2 to enable interrupts
    uint8_t modem_config = static_cast<uint8_t>(modem_control_flags::RTS_DSR) |
                           static_cast<uint8_t>(modem_control_flags::OUT2);
    outb(modem_command_port_offset(port), modem_config);

    // Enable "Received Data Available" interrupt
    outb(interrupt_enable_port_offset(port), 0x01);
}

void set_baud_rate(uint16_t port, baud_rate_divisor divisor) {
    // Enable DLAB (Divisor Latch Access)
    outb(line_command_port_offset(port), static_cast<uint8_t>(line_control_flags::ENABLE_DLAB));

    // Set baud rate divisor
    auto divisor_value = static_cast<uint8_t>(divisor);
    outb(data_port_offset(port), divisor_value);    // Low byte
    outb(interrupt_enable_port_offset(port), 0x00); // High byte (always 0 for these divisors)

    // Clear DLAB after setting the divisor
    outb(line_command_port_offset(port),
         static_cast<uint8_t>(line_control_flags::EIGHT_BITS_NO_PARITY_ONE_STOP));
}

bool is_transmit_queue_empty(uint16_t port) {
    uint8_t status = inb(line_status_port_offset(port));
    return (status & static_cast<uint8_t>(line_status_flags::TRANSMIT_EMPTY)) != 0;
}

bool is_data_available(uint16_t port) {
    uint8_t status = inb(line_status_port_offset(port));
    return (status & static_cast<uint8_t>(line_status_flags::DATA_READY)) != 0;
}

void write(uint16_t port, char chr) {
    // Wait for the transmit queue to be empty
    while (!is_transmit_queue_empty(port)) {
        // Busy wait
    }

    // Write the byte to the data port
    outb(data_port_offset(port), chr);
}

void write(uint16_t port, const char* str) {
    while (*str != '\0') {
        write(port, *str);
        if (*str == '\n') {
            // Treat "\n" as the CRLF ("\n\r") combo
            write(port, '\r');
        }
        ++str;
    }
}

void write(uint16_t port, const char* str, uint32_t length) {
    for (uint32_t i = 0; i < length; i++) {
        write(port, str[i]);
        if (str[i] == '\n') {
            // Treat "\n" as the CRLF ("\n\r") combo
            write(port, '\r');
        }
    }
}

char read(uint16_t port) {
    // Wait until data is available
    while (!is_data_available(port)) {
        // Busy wait
    }

    // Read and return the character from the data port
    return static_cast<char>(inb(data_port_offset(port)));
}

void set_kernel_uart_port(uint16_t port) {
    g_kernel_uart_port = port;
}

} // namespace serial