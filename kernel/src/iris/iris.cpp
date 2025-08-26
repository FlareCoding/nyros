#include <iris/iris.h>
#include <serial/serial.h>

namespace iris {

void emit(uint16_t event_type, uint64_t timestamp_ns, uint8_t cpu_id) {
    // Build packet on stack - no heap allocation, no copying
    packet pkt = {.magic = PACKET_MAGIC,
                  .length = sizeof(packet) - 6, // Exclude magic (4) + length (2)
                  .reserved = 0,
                  .timestamp = timestamp_ns,
                  .event_type = event_type,
                  .cpu_id = cpu_id,
                  .reserved1 = 0,
                  .reserved2 = 0};

    // Single write call - send entire packet at once for efficiency
    // Cast to char* as serial::write expects, no data copy occurs
    serial::write(IRIS_SERIAL_PORT, reinterpret_cast<const char*>(&pkt), sizeof(pkt));
}

void emit_with_payload(uint16_t event_type, uint64_t timestamp_ns, uint8_t cpu_id,
                       const void* payload, uint16_t payload_size) {
    // Build packet header with adjusted length to include payload
    packet pkt = {.magic = PACKET_MAGIC,
                  .length = static_cast<uint16_t>(sizeof(packet) - 6 + payload_size),
                  .reserved = 0,
                  .timestamp = timestamp_ns,
                  .event_type = event_type,
                  .cpu_id = cpu_id,
                  .reserved1 = 0,
                  .reserved2 = 0};

    // Send header first
    serial::write(IRIS_SERIAL_PORT, reinterpret_cast<const char*>(&pkt), sizeof(pkt));

    // Send payload if present
    if (payload && payload_size > 0) {
        serial::write(IRIS_SERIAL_PORT, reinterpret_cast<const char*>(payload), payload_size);
    }
}

void init() {
    // Initialize COM2 port for IRIS debug output
    // Using 115200 baud for maximum throughput
    serial::init_port(IRIS_SERIAL_PORT, serial::baud_rate_divisor::BAUD_115200);

    // Emit initialization event to signal IRIS is ready
    // Timestamp is 0 as HPET likely not initialized yet
    emit(EVENT_IRIS_INIT, 0, 0);
}

} // namespace iris
