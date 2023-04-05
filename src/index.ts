import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as dotenv from "dotenv";
import { GlassSocket } from "./socket";
import { log } from "./socket/console";
import { resolve } from "path";

dotenv.config();

export const socket = new GlassSocket();
export let START_DIR = process.cwd();

(async () => {
    const args = await yargs(hideBin(process.argv))
        .option('token', {
            alias: 't',
            type: 'string',
            description: 'Change the token to use.'
        }).option('start_dir', {
            alias: 'sd',
            type: 'string',
            description: 'Changes the start directory.'
        }).parse();

    if (args.start_dir) {
        START_DIR = resolve(args.start_dir);
    }

    log('', { prefix: '' });
    log('Connecting to Glass Websocket...');
    log('§6Glass-Standalone by GStudiosX has started up.');

    socket.connect(args.token || process.env.token, process.env.base_url);
})();