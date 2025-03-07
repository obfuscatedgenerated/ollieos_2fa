import {ANSI, NEWLINE} from "ollieos/src/term_ctl";
import {ProgramMainData} from "ollieos/src/types"

import {KEY_DIR} from ".";

// extract from ANSI to make code less verbose
const {STYLE, PREFABS, FG} = ANSI;

export const list_subcommand = async (data: ProgramMainData) => {
    // extract from data to make code less verbose
    const {args, term} = data;

    // remove subcommand name
    args.shift();

    if ("-k" in args) {
    }

    const fs = term.get_fs();

    term.writeln("not implemented yet.")

    return 0;
}
