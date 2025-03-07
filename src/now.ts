import {ANSI, NEWLINE} from "ollieos/src/term_ctl";
import {ProgramMainData} from "ollieos/src/types"

import {generate_totp, KEY_DIR} from ".";

// extract from ANSI to make code less verbose
const {STYLE, PREFABS, FG} = ANSI;

export const now_subcommand = async (data: ProgramMainData) => {
    // extract from data to make code less verbose
    const {args, term} = data;

    // remove subcommand name
    args.shift();

    if (args.length !== 1) {
        term.writeln(`${PREFABS.error}Expected a key argument only.${STYLE.reset_all}`);
        term.writeln(`Try '2fa -h' for more information.${STYLE.reset_all}`);
        return 1;
    }

    const key = args[0].toUpperCase();

    let totp: number;
    try {
        totp = await generate_totp(key);
    } catch (e) {
        term.writeln(`${PREFABS.error}Error generating TOTP: ${e}${STYLE.reset_all}`);
        return 1;
    }

    term.writeln(totp.toString());
    return 0;
}
