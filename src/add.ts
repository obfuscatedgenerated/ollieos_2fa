import {ANSI, NEWLINE} from "ollieos/lib/ansi";
import {ProgramMainData} from "ollieos/types"

import {KEY_DIR} from ".";

// extract from ANSI to make code less verbose
const {STYLE, PREFABS, FG} = ANSI;

export const add_subcommand = async (data: ProgramMainData) => {
    // extract from data to make code less verbose
    const {args, term, kernel} = data;

    // remove subcommand name
    args.shift();

    if (args.length !== 2) {
        term.writeln(`${PREFABS.error}Expected a label and key argument only.${STYLE.reset_all}`);
        term.writeln(`Try '2fa -h' for more information.${STYLE.reset_all}`);
        return 1;
    }

    const fs = kernel.get_fs();

    term.writeln("not implemented yet.")

    return 0;
}
