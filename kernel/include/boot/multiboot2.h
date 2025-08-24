#ifndef MULTIBOOT_HEADER
#define MULTIBOOT_HEADER 1

#ifndef ASM_FILE

#include <core/types.h>

namespace multiboot
{

// Magic values
inline constexpr uint32_t SEARCH_BYTES = 32768;
inline constexpr uint32_t HEADER_ALIGN = 8;
inline constexpr uint32_t HEADER_MAGIC = 0xe85250d6;
inline constexpr uint32_t BOOTLOADER_MAGIC = 0x36d76289;

// Alignment requirements
inline constexpr uint32_t MOD_ALIGN = 0x00001000;
inline constexpr uint32_t INFO_ALIGN = 0x00000008;
inline constexpr uint32_t TAG_ALIGN = 8;

// Tag types
enum class tag_type : uint8_t {
    END = 0,
    CMDLINE = 1,
    BOOT_LOADER_NAME = 2,
    MODULE = 3,
    BASIC_MEMINFO = 4,
    BOOTDEV = 5,
    MMAP = 6,
    VBE = 7,
    FRAMEBUFFER = 8,
    ELF_SECTIONS = 9,
    APM = 10,
    EFI32 = 11,
    EFI64 = 12,
    SMBIOS = 13,
    ACPI_OLD = 14,
    ACPI_NEW = 15,
    NETWORK = 16,
    EFI_MMAP = 17,
    EFI_BS = 18,
    EFI32_IH = 19,
    EFI64_IH = 20,
    LOAD_BASE_ADDR = 21
};

// Header tag types
enum class header_tag_type : uint8_t {
    END = 0,
    INFORMATION_REQUEST = 1,
    ADDRESS = 2,
    ENTRY_ADDRESS = 3,
    CONSOLE_FLAGS = 4,
    FRAMEBUFFER = 5,
    MODULE_ALIGN = 6,
    EFI_BS = 7,
    ENTRY_ADDRESS_EFI64 = 9,
    RELOCATABLE = 10
};

// Architecture types
enum class architecture : uint8_t { I386 = 0, MIPS32 = 4 };

// Header tag flags
inline constexpr uint32_t HEADER_TAG_OPTIONAL = 1;

// Load preferences
enum class load_preference : uint8_t { NONE = 0, LOW = 1, HIGH = 2 };

// Console flags
enum class console_flags : uint8_t { CONSOLE_REQUIRED = 1, EGA_TEXT_SUPPORTED = 2 };

// Memory types
enum class memory_type : uint8_t {
    AVAILABLE = 1,
    RESERVED = 2,
    ACPI_RECLAIMABLE = 3,
    ACPI_NON_VOLATILE_STORAGE = 4,
    BAD_MEMORY = 5
};

struct header {
    uint32_t magic;
    uint32_t architecture;
    uint32_t header_length;
    uint32_t checksum;
};

struct header_tag {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
};

struct header_tag_information_request {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t requests[0];
};

struct header_tag_address {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t header_addr;
    uint32_t load_addr;
    uint32_t load_end_addr;
    uint32_t bss_end_addr;
};

struct header_tag_entry_address {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t entry_addr;
};

struct header_tag_console_flags {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t console_flags;
};

struct header_tag_framebuffer {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t width;
    uint32_t height;
    uint32_t depth;
};

struct header_tag_module_align {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
};

struct header_tag_relocatable {
    uint16_t type;
    uint16_t flags;
    uint32_t size;
    uint32_t min_addr;
    uint32_t max_addr;
    uint32_t align;
    uint32_t preference;
};

struct color {
    uint8_t red;
    uint8_t green;
    uint8_t blue;
};

struct mmap_entry {
    uint32_t base_addr_low;
    uint32_t base_addr_high;
    uint32_t length_low;
    uint32_t length_high;
    uint32_t type;
    uint32_t zero;
};

using memory_map_t = mmap_entry;

struct tag {
    uint32_t type;
    uint32_t size;
};

struct tag_string {
    uint32_t type;
    uint32_t size;
    char string[0];
};

struct tag_module {
    uint32_t type;
    uint32_t size;
    uint32_t mod_start;
    uint32_t mod_end;
    char cmdline[0];
};

struct tag_basic_meminfo {
    uint32_t type;
    uint32_t size;
    uint32_t mem_lower;
    uint32_t mem_upper;
};

struct tag_bootdev {
    uint32_t type;
    uint32_t size;
    uint32_t biosdev;
    uint32_t slice;
    uint32_t part;
};

struct tag_mmap {
    uint32_t type;
    uint32_t size;
    uint32_t entry_size;
    uint32_t entry_version;
    struct mmap_entry entries[0];
};

struct vbe_info_block {
    uint8_t external_specification[512];
};

struct vbe_mode_info_block {
    uint8_t external_specification[256];
};

struct tag_vbe {
    uint32_t type;
    uint32_t size;
    uint16_t vbe_mode;
    uint16_t vbe_interface_seg;
    uint16_t vbe_interface_off;
    uint16_t vbe_interface_len;
    struct vbe_info_block vbe_control_info;
    struct vbe_mode_info_block vbe_mode_info;
};

struct tag_framebuffer_common {
    uint32_t type;
    uint32_t size;
    uint64_t framebuffer_addr;
    uint32_t framebuffer_pitch;
    uint32_t framebuffer_width;
    uint32_t framebuffer_height;
    uint8_t framebuffer_bpp;
    uint8_t framebuffer_type;
    uint16_t reserved;
};

struct framebuffer_palette_color_descriptor {
    uint8_t red;
    uint8_t green;
    uint8_t blue;
};

struct tag_framebuffer {
    tag_framebuffer_common common;
    union {
        struct {
            uint16_t framebuffer_palette_num_colors;
            framebuffer_palette_color_descriptor framebuffer_palette[0];
        };
        struct {
            uint8_t framebuffer_red_field_position;
            uint8_t framebuffer_red_mask_size;
            uint8_t framebuffer_green_field_position;
            uint8_t framebuffer_green_mask_size;
            uint8_t framebuffer_blue_field_position;
            uint8_t framebuffer_blue_mask_size;
        };
    };
};

struct tag_elf_sections {
    uint32_t type;
    uint32_t size;
    uint32_t num;
    uint32_t entsize;
    uint32_t shndx;
    char sections[0];
};

struct tag_apm {
    uint32_t type;
    uint32_t size;
    uint16_t version;
    uint16_t cseg;
    uint32_t offset;
    uint16_t cseg_16;
    uint16_t dseg;
    uint16_t flags;
    uint16_t cseg_len;
    uint16_t cseg_16_len;
    uint16_t dseg_len;
};

struct tag_efi32 {
    uint32_t type;
    uint32_t size;
    uint32_t pointer;
};

struct tag_efi64 {
    uint32_t type;
    uint32_t size;
    uint64_t pointer;
};

struct tag_smbios {
    uint32_t type;
    uint32_t size;
    uint8_t major;
    uint8_t minor;
    uint8_t reserved[6];
    uint8_t tables[0];
};

struct tag_acpi_old {
    uint32_t type;
    uint32_t size;
    uint8_t rsdp[0];
};

struct tag_acpi_new {
    uint32_t type;
    uint32_t size;
    uint8_t rsdp[0];
};

struct tag_network {
    uint32_t type;
    uint32_t size;
    uint8_t dhcpack[0];
};

struct tag_efi_mmap {
    uint32_t type;
    uint32_t size;
    uint32_t descr_size;
    uint32_t descr_vers;
    uint8_t efi_mmap[0];
};

struct tag_efi32_ih {
    uint32_t type;
    uint32_t size;
    uint32_t pointer;
};

struct tag_efi64_ih {
    uint32_t type;
    uint32_t size;
    uint64_t pointer;
};

struct tag_load_base_addr {
    uint32_t type;
    uint32_t size;
    uint32_t load_base_addr;
};

} // namespace multiboot

#endif // !ASM_FILE

// Keep essential macros for assembly files only
#ifdef ASM_FILE
#define MULTIBOOT2_HEADER_MAGIC 0xe85250d6
#define MULTIBOOT2_BOOTLOADER_MAGIC 0x36d76289
#define MULTIBOOT_HEADER_ALIGN 8
#define MULTIBOOT_HEADER_TAG_END 0
#define MULTIBOOT_HEADER_TAG_INFORMATION_REQUEST 1
#define MULTIBOOT_HEADER_TAG_MODULE_ALIGN 6
#define MULTIBOOT_TAG_TYPE_MODULE 3
#endif

#endif // MULTIBOOT_HEADER