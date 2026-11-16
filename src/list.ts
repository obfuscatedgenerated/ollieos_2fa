import {ANSI, NEWLINE} from "ollieos/lib/ansi";
import {ProgramMainData} from "ollieos/types";

import {KEY_DIR} from ".";

// extract from ANSI to make code less verbose
const {STYLE, PREFABS, FG} = ANSI;

export const list_subcommand = async (data: ProgramMainData) => {
    // extract from data to make code less verbose
    const {args, term, kernel} = data;

    // remove subcommand name
    args.shift();

    if ("-k" in args) {
    }

    const fs = kernel.get_fs();

    term.writeln("not implemented yet.")

    return 0;
}
