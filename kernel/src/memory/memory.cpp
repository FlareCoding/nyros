#include <memory/memory.h>

namespace memory {

int memcmp(const void* lhs, const void* rhs, size_t count) {
    if (lhs == rhs) {
        return 0;
    }

    if (count == 0) {
        return 0;
    }

    const auto* left = static_cast<const uint8_t*>(lhs);
    const auto* right = static_cast<const uint8_t*>(rhs);

    // Word-aligned comparison for better performance
    while (count >= sizeof(uint64_t) &&
           (reinterpret_cast<uintptr_t>(left) & (sizeof(uint64_t) - 1)) == 0 &&
           (reinterpret_cast<uintptr_t>(right) & (sizeof(uint64_t) - 1)) == 0) {

        uint64_t left_word = *reinterpret_cast<const uint64_t*>(left);
        uint64_t right_word = *reinterpret_cast<const uint64_t*>(right);

        if (left_word != right_word) {
            // Fall back to byte-by-byte comparison for this word
            break;
        }

        left += sizeof(uint64_t);
        right += sizeof(uint64_t);
        count -= sizeof(uint64_t);
    }

    // Byte-by-byte comparison for remainder
    while (count > 0) {
        int diff = static_cast<int>(*left) - static_cast<int>(*right);
        if (diff != 0) {
            return diff;
        }
        ++left;
        ++right;
        --count;
    }

    return 0;
}

void* memcpy(void* dest, const void* src, size_t count) {
    if (dest == src || count == 0) {
        return dest;
    }

    auto* dst_bytes = static_cast<uint8_t*>(dest);
    const auto* src_bytes = static_cast<const uint8_t*>(src);

    // Word-aligned copy for better performance
    while (count >= sizeof(uint64_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint64_t) - 1)) == 0 &&
           (reinterpret_cast<uintptr_t>(src_bytes) & (sizeof(uint64_t) - 1)) == 0) {

        *reinterpret_cast<uint64_t*>(dst_bytes) = *reinterpret_cast<const uint64_t*>(src_bytes);
        dst_bytes += sizeof(uint64_t);
        src_bytes += sizeof(uint64_t);
        count -= sizeof(uint64_t);
    }

    // Handle 32-bit chunks
    while (count >= sizeof(uint32_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint32_t) - 1)) == 0 &&
           (reinterpret_cast<uintptr_t>(src_bytes) & (sizeof(uint32_t) - 1)) == 0) {

        *reinterpret_cast<uint32_t*>(dst_bytes) = *reinterpret_cast<const uint32_t*>(src_bytes);
        dst_bytes += sizeof(uint32_t);
        src_bytes += sizeof(uint32_t);
        count -= sizeof(uint32_t);
    }

    // Byte-by-byte copy for remainder
    while (count > 0) {
        *dst_bytes = *src_bytes;
        ++dst_bytes;
        ++src_bytes;
        --count;
    }

    return dest;
}

void* memmove(void* dest, const void* src, size_t count) {
    if (dest == src || count == 0) {
        return dest;
    }

    auto* dst_bytes = static_cast<uint8_t*>(dest);
    const auto* src_bytes = static_cast<const uint8_t*>(src);

    // Check for overlap
    if (dst_bytes < src_bytes || dst_bytes >= (src_bytes + count)) {
        // No overlap, use optimized memcpy
        return memcpy(dest, src, count);
    }

    // Overlapping regions - copy backwards to avoid corruption
    // At this point dst_bytes > src_bytes is always true
    dst_bytes += count - 1;
    src_bytes += count - 1;

    // Backwards byte-by-byte copy
    while (count > 0) {
        *dst_bytes = *src_bytes;
        --dst_bytes;
        --src_bytes;
        --count;
    }

    return dest;
}

void* memset(void* dest, int value, size_t count) {
    if (count == 0) {
        return dest;
    }

    auto* dst_bytes = static_cast<uint8_t*>(dest);
    auto byte_value = static_cast<uint8_t>(value);

    // Create word-sized pattern for optimization
    uint64_t pattern = byte_value;
    pattern |= (pattern << 8);
    pattern |= (pattern << 16);
    pattern |= (pattern << 32);

    // Word-aligned setting for better performance
    while (count >= sizeof(uint64_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint64_t) - 1)) == 0) {

        *reinterpret_cast<uint64_t*>(dst_bytes) = pattern;
        dst_bytes += sizeof(uint64_t);
        count -= sizeof(uint64_t);
    }

    // Handle 32-bit chunks
    auto pattern32 = static_cast<uint32_t>(pattern);
    while (count >= sizeof(uint32_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint32_t) - 1)) == 0) {

        *reinterpret_cast<uint32_t*>(dst_bytes) = pattern32;
        dst_bytes += sizeof(uint32_t);
        count -= sizeof(uint32_t);
    }

    // Byte-by-byte setting for remainder
    while (count > 0) {
        *dst_bytes = byte_value;
        ++dst_bytes;
        --count;
    }

    return dest;
}

void* memzero(void* dest, size_t count) {
    if (count == 0) {
        return dest;
    }

    auto* dst_bytes = static_cast<uint8_t*>(dest);

    // Word-aligned zeroing for better performance
    while (count >= sizeof(uint64_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint64_t) - 1)) == 0) {

        *reinterpret_cast<uint64_t*>(dst_bytes) = 0;
        dst_bytes += sizeof(uint64_t);
        count -= sizeof(uint64_t);
    }

    // Handle 32-bit chunks
    while (count >= sizeof(uint32_t) &&
           (reinterpret_cast<uintptr_t>(dst_bytes) & (sizeof(uint32_t) - 1)) == 0) {

        *reinterpret_cast<uint32_t*>(dst_bytes) = 0;
        dst_bytes += sizeof(uint32_t);
        count -= sizeof(uint32_t);
    }

    // Byte-by-byte zeroing for remainder
    while (count > 0) {
        *dst_bytes = 0;
        ++dst_bytes;
        --count;
    }

    return dest;
}

} // namespace memory
