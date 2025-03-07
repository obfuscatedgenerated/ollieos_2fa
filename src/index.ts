import type { Program } from "ollieos/src/types";
import { ANSI } from "ollieos/src/term_ctl";

import {add_subcommand} from "./add";
import {remove_subcommand} from "./remove";
import {list_subcommand} from "./list";
import {get_subcommand} from "./get";
import {now_subcommand} from "./now";

// extract from ANSI to make code less verbose
const { STYLE, PREFABS } = ANSI;

export const KEY_DIR = "/var/lib/2fa";

// these should stay default to be compatible with most TOTP implementations
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD = 30;
export const TOTP_OFFSET = 0;
export const TOTP_ALGORITHM = "SHA-1";

const base32_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32_decode = (base32: string) => {
    // trim equals at the end of the base32 string
    base32 = base32.replace(/=+$/, "");

    // each character of base32 is 5 bits of data
    const buffer = new ArrayBuffer(base32.length * 5 / 8);
    const view = new DataView(buffer);

    let bits = 0;
    let bit_count = 0;
    let offset = 0;

    for (let i = 0; i < base32.length; i++) {
        const char = base32_charset.indexOf(base32[i]);
        if (char === -1) {
            throw new Error(`Invalid base32 character '${base32[i]}'`);
        }

        // add the value to the buffer
        bits = (bits << 5) | char;
        bit_count += 5;

        // if we have enough bits to write a byte then do so until we have less than 8 bits
        while (bit_count >= 8) {
            view.setUint8(offset++, bits >> (bit_count - 8));
            bit_count -= 8;
        }
    }

    return new Uint8Array(buffer);
}

const get_time_code_64bit = () => {
    const time = Math.floor((Date.now() - TOTP_OFFSET) / 1000 / TOTP_PERIOD);

    // create 8 byte big endian buffer
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    // write time to 64 bit buffer by writing the lower 32 bits first then the upper 32 bits
    view.setUint32(4, time, false);
    view.setUint32(0, Math.floor(time / (2 ** 32)), false);

    return new Uint8Array(buffer);
}

const truncate_hotp = (hash: Uint8Array) => {
    if (hash.length !== 20) {
        throw new Error("Invalid hash length for HOTP");
    }

    // get the last 4 bits of the hash
    const offset = hash[hash.length - 1] & 0xf;

    // get the 4 bytes at the offset
    const value = (
        (hash[offset] & 0x7f) << 24 |
        (hash[offset + 1] & 0xff) << 16 |
        (hash[offset + 2] & 0xff) << 8 |
        (hash[offset + 3] & 0xff)
    );

    // truncate to 6 digits
    return value % (10 ** TOTP_DIGITS);
}

export const generate_totp = async (key: string) => {
    const hmac = await window.crypto.subtle.importKey(
        "raw",
        base32_decode(key),
        {
            name: "HMAC",
            hash: {name: TOTP_ALGORITHM}
        },
        false,
        ["sign"]
    );

    const hash = await window.crypto.subtle.sign(
        "HMAC",
        hmac,
        get_time_code_64bit()
    );

    return truncate_hotp(new Uint8Array(hash));
}

export const get_lifetime_remaining_seconds = (generated_date: Date) => {
    const offset_now = Math.floor((Date.now() / 1000) + TOTP_OFFSET);
    const generated_at = Math.floor(generated_date.getTime() / 1000);
    return TOTP_PERIOD - ((offset_now - generated_at) % TOTP_PERIOD);
}

export default {
    name: "2fa",
    description: "TOTP code generator and storage. Do not use this on anything serious!",
    usage_suffix: "[-h] [subcommand] [arguments]",
    arg_descriptions: {
        "Subcommands:": {
            "now": `Generates a code given a key once off: ${PREFABS.program_name}2fa${STYLE.reset_all + STYLE.italic} now <key>${STYLE.reset_all}`,
            "add": `Adds a key to the storage, retreivable with the given label: ${PREFABS.program_name}2fa${STYLE.reset_all + STYLE.italic} add <label> <key>`,
            "remove": `Removes a key from the storage: ${PREFABS.program_name}2fa${STYLE.reset_all + STYLE.italic} remove <label>`,
            "get": `Generates a code given a key from the storage: ${PREFABS.program_name}2fa${STYLE.reset_all + STYLE.italic} get <label>`,
            "list": `Lists all keys in the storage: ${PREFABS.program_name}2fa${STYLE.reset_all + STYLE.italic} list [-k]`,
        },
        "Arguments:": {
            "-h": "Displays this help message.",
            "For now": {
                "key": "Base32 encoded key to generate a code for. Case insensitive."
            },
            "For add": {
                "label": "Label to store the key under. Should be unique. Spaces are not allowed. Case sensitive.", // TODO: support quotes, might need to modify terminal to do this but can bodge with args joining
                "key": "Base32 encoded key to store. Case insensitive."
            },
            "For remove": {
                "label": "Label of the key to remove. Case sensitive."
            },
            "For get": {
                "label": "Label of the key to generate a code for. Case sensitive."
            },
            "For list": {
                "-k": "Show the keys alongside their labels."
            }
        }
    },
    main: async (data) => {
        // TODO: safety prompt on first use
        // TODO: optional key storage encryption key
        // TODO: option to specify number of digits, store in key file if applicable

        // extract from data to make code less verbose
        const {args, term} = data;
        const fs = term.get_fs();

        if (args.length === 0) {
            term.writeln(`${PREFABS.error}Missing subcommand.`)
            term.writeln(`Try '2fa -h' for more information.${STYLE.reset_all}`);
            return 1;
        }

        if (args.includes("-h")) {
            term.execute("help 2fa");
            return 0;
        }

        // create /var/lib/2fa if it doesn't exist so subcommands don't have to check
        if (!fs.exists(KEY_DIR)) {
            fs.make_dir(KEY_DIR);
        }

        switch (args[0]) {
            case "add":
                return await add_subcommand(data);
            case "remove":
                return await remove_subcommand(data);
            case "list":
                return await list_subcommand(data);
            case "get":
                return await get_subcommand(data);
            case "now":
                return await now_subcommand(data);
            default:
                term.writeln(`${PREFABS.error}Invalid subcommand.`);
                term.writeln(`Try '2fa -h' for more information.${STYLE.reset_all}`);
                return 1;
        }
    }
} as Program;
