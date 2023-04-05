import { CONSOLE_LOGS } from "../console";
import * as out from "../console";
import { Command } from "../../types";

export default {
    name: ['FETCH_CONSOLE_HISTORY', 'EXECUTE_COMMAND'],
    callback: (name: string, args: any[]) => {
        switch (name) {
            case 'FETCH_CONSOLE_HISTORY': {
                const [ack] = args;
                ack(JSON.stringify({ logs: CONSOLE_LOGS }));
                break;
            }

            case 'EXECUTE_COMMAND': {
                const command: Command = JSON.parse(args[0]);

                if (command.original.trim() === '') {
                    return;
                }

                out.warn(`'EXECUTE_COMMAND' has not been implemented yet: ${JSON.stringify(command)}`, {
                    send: true
                });
                break;
            }
        }
    }
}