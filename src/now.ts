import {ANSI, NEWLINE} from "ollieos/src/term_ctl";
import {ProgramMainData} from "ollieos/src/types"

import {generate_totp, get_lifetime_remaining_seconds, TOTP_DIGITS} from ".";

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
    let generation_time: number;
    try {
        generation_time = Date.now();
        totp = await generate_totp(key);
    } catch (e) {
        term.writeln(`${PREFABS.error}Error generating TOTP: ${e}${STYLE.reset_all}`);
        return 1;
    }

    const lifetime = get_lifetime_remaining_seconds(generation_time);

    // ensure the code is 6 digits long, zero-padded
    term.writeln(totp.toString().padStart(TOTP_DIGITS, "0"));

    // show lifetime, if it's less than 10 seconds then show it in red
    const lifetime_str = `Expires in ${lifetime} seconds`;

    if (lifetime < 10) {
        term.writeln(`${FG.red}${lifetime_str}${STYLE.reset_all}`);
    } else {
        term.writeln(lifetime_str);
    }

    return 0;
}
