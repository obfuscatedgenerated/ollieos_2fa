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

    term.writeln("Please paste your Base32 encoded key to generate a code for. Case insensitive:");
    const key = (await term.get_text()).toUpperCase();

    let totp: number;
    let generated_at: Date;
    try {
        generated_at = new Date();
        totp = await generate_totp(key);
    } catch (e) {
        term.writeln(`${PREFABS.error}Error generating TOTP: ${e}${STYLE.reset_all}`);
        return 1;
    }

    const lifetime = get_lifetime_remaining_seconds(generated_at);

    // ensure the code is 6 digits long, zero-padded
    term.writeln(totp.toString().padStart(TOTP_DIGITS, "0"));

    // show lifetime, if it's <= 10 seconds then show it in red
    const lifetime_str = `Expires in ${lifetime} seconds`;

    if (lifetime <= 10) {
        term.writeln(`${FG.red}${lifetime_str}${STYLE.reset_all}`);
    } else {
        term.writeln(lifetime_str);
    }

    return 0;
}
