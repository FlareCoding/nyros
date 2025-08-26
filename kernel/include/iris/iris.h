#ifndef IRIS_H
#define IRIS_H

#include <core/types.h>
#include <serial/serial.h>

namespace iris {

// Magic bytes for packet identification: 'IRIS' in little-endian
inline constexpr uint32_t PACKET_MAGIC = 0x53495249;

// COM2 port for IRIS debug output
inline constexpr uint16_t IRIS_SERIAL_PORT = static_cast<uint16_t>(serial::port_base::COM2);

// Packet structure - 24 bytes total, 8-byte aligned
struct packet {
    // Frame header (8 bytes)
    uint32_t magic;    // 0x53495249 ('IRIS' in little-endian)
    uint16_t length;   // Bytes after this field (currently always 16)
    uint16_t reserved; // Padding for 8-byte alignment

    // Event header (16 bytes)
    uint64_t timestamp;  // Nanoseconds since boot (0 before HPET init)
    uint16_t event_type; // Event type identifier
    uint8_t cpu_id;      // CPU core ID
    uint8_t reserved1;   // Padding
    uint32_t reserved2;  // Reserved for future use (sequence number, flags, etc.)
} __attribute__((packed));

static_assert(sizeof(packet) == 24, "IRIS packet must be exactly 24 bytes");
static_assert(sizeof(packet) % 8 == 0, "IRIS packet must be 8-byte aligned");

/**
 * @brief Emits a basic IRIS event packet without payload.
 *
 * This function creates and sends an IRIS packet with the specified event type.
 * The packet is sent directly to COM2 without buffering to ensure real-time
 * debugging capability, especially important for catching events before crashes.
 *
 * @param event_type The type identifier for this event.
 * @param timestamp_ns System uptime in nanoseconds (use 0 if HPET not initialized).
 * @param cpu_id The ID of the CPU core generating this event.
 */
void emit(uint16_t event_type, uint64_t timestamp_ns, uint8_t cpu_id);

/**
 * @brief Initializes the IRIS debug system.
 *
 * Sets up the COM2 serial port for IRIS communication. This should be called
 * early in the kernel initialization process, after serial ports are available.
 */
void init();

} // namespace iris

#endif
